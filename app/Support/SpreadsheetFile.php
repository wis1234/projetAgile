<?php

namespace App\Support;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

final class SpreadsheetFile
{
    public static function fromFile(string $path, string $contents): string
    {
        $data = json_decode($contents, true);
        if (is_array($data) && isset($data['sheets'], $data['sheetNames'])) {
            return $contents;
        }

        $reader = IOFactory::createReaderForFile($path);
        if (method_exists($reader, 'setIncludeCharts')) {
            $reader->setIncludeCharts(true);
        }
        $workbook = $reader->load($path);
        $sheets = [];
        $cellStyles = [];
        $nativeStyles = [];
        $sheetMetadata = [];
        $sheetNames = [];

        foreach ($workbook->getWorksheetIterator() as $worksheet) {
            $sheetName = $worksheet->getTitle();
            $sheetNames[] = $sheetName;
            $sheetMetadata[$sheetName] = [
                'mergedCells' => array_values($worksheet->getMergeCells()),
                'freezePane' => $worksheet->getFreezePane(),
                'columnDimensions' => [],
                'rowDimensions' => [],
            ];
            $sheets[$sheetName] = array_map(
                static fn (array $row): array => array_map(
                    static fn ($value) => $value ?? '',
                    $row
                ),
                $worksheet->toArray(null, false, false, false)
            );

            foreach ($worksheet->getColumnDimensions() as $column => $dimension) {
                $sheetMetadata[$sheetName]['columnDimensions'][$column] = [
                    'width' => $dimension->getWidth(),
                    'visible' => $dimension->getVisible(),
                    'outlineLevel' => $dimension->getOutlineLevel(),
                ];
            }
            foreach ($worksheet->getRowDimensions() as $row => $dimension) {
                $sheetMetadata[$sheetName]['rowDimensions'][(string) ((int) $row - 1)] = [
                    'height' => $dimension->getRowHeight(),
                    'visible' => $dimension->getVisible(),
                    'outlineLevel' => $dimension->getOutlineLevel(),
                ];
            }

            foreach ($worksheet->getCellCollection()->getCoordinates() as $coordinate) {
                $style = $worksheet->getStyle($coordinate);
                $font = $style->getFont();
                $alignment = $style->getAlignment();
                $fill = $style->getFill();
                $borders = $style->getBorders();
                $nativeStyle = [
                    'font' => [
                        'name' => $font->getName(),
                        'latin' => $font->getLatin(),
                        'eastAsian' => $font->getEastAsian(),
                        'complexScript' => $font->getComplexScript(),
                        'size' => $font->getSize(),
                        'bold' => $font->getBold(),
                        'italic' => $font->getItalic(),
                        'underline' => $font->getUnderline(),
                        'strikethrough' => $font->getStrikethrough(),
                        'strikeType' => $font->getStrikeType(),
                        'baseLine' => $font->getBaseLine(),
                        'scheme' => $font->getScheme(),
                        'color' => ['argb' => $font->getColor()->getARGB()],
                        'superscript' => $font->getSuperscript(),
                        'subscript' => $font->getSubscript(),
                    ],
                    'alignment' => [
                        'horizontal' => $alignment->getHorizontal(),
                        'vertical' => $alignment->getVertical(),
                        'wrapText' => $alignment->getWrapText(),
                        'shrinkToFit' => $alignment->getShrinkToFit(),
                        'textRotation' => $alignment->getTextRotation(),
                        'indent' => $alignment->getIndent(),
                        'readOrder' => $alignment->getReadOrder(),
                    ],
                    'fill' => [
                        'fillType' => $fill->getFillType(),
                        'startColor' => ['argb' => $fill->getStartColor()->getARGB()],
                        'endColor' => ['argb' => $fill->getEndColor()->getARGB()],
                        'rotation' => $fill->getRotation(),
                    ],
                    'numberFormat' => ['formatCode' => $style->getNumberFormat()->getFormatCode()],
                    'protection' => [
                        'locked' => $style->getProtection()->getLocked(),
                        'hidden' => $style->getProtection()->getHidden(),
                    ],
                ];
                foreach (['left', 'right', 'top', 'bottom', 'diagonal'] as $side) {
                    $border = $borders->{'get' . ucfirst($side)}();
                    $nativeStyle['borders'][$side] = [
                        'borderStyle' => $border->getBorderStyle(),
                        'color' => ['argb' => $border->getColor()->getARGB()],
                    ];
                }
                $nativeStyle['borders']['diagonalDirection'] = $borders->getDiagonalDirection();

                $styleId = $style->getHashCode();
                $nativeStyles[$styleId] ??= $nativeStyle;

                $fontColor = self::toCssColor($font->getColor()->getARGB());
                $fillColor = self::toCssColor($fill->getStartColor()->getARGB());
                $cellStyle = [
                    'nativeStyleId' => $styleId,
                    'fontName' => $font->getName(),
                    'fontSize' => $font->getSize(),
                    'bold' => $font->getBold(),
                    'italic' => $font->getItalic(),
                    'underline' => $font->getUnderline(),
                    'strike' => $font->getStrikethrough(),
                    'color' => $fontColor,
                    'fillType' => $fill->getFillType(),
                    'bg' => $fill->getFillType() === 'solid' ? $fillColor : null,
                    'align' => $alignment->getHorizontal(),
                    'verticalAlign' => $alignment->getVertical(),
                    'wrapText' => $alignment->getWrapText(),
                    'shrinkToFit' => $alignment->getShrinkToFit(),
                    'textRotation' => $alignment->getTextRotation(),
                    'indent' => $alignment->getIndent(),
                    'numberFormat' => $style->getNumberFormat()->getFormatCode(),
                ];
                foreach (['left', 'right', 'top', 'bottom'] as $side) {
                    $border = $borders->{'get' . ucfirst($side)}();
                    if ($border->getBorderStyle() !== 'none') {
                        $cellStyle['border' . ucfirst($side)] = [
                            'style' => $border->getBorderStyle(),
                            'color' => self::toCssColor($border->getColor()->getARGB()),
                        ];
                    }
                }

                [$column, $row] = Coordinate::coordinateFromString($coordinate);
                $key = $sheetName . '!' . ((int) $row - 1) . '_' . (Coordinate::columnIndexFromString($column) - 1);
                $cellStyles[$key] = array_filter(
                    $cellStyle,
                    static fn ($value) => $value !== null
                );
            }
        }

        if (!$sheetNames) {
            $sheetNames = ['Feuille 1'];
            $sheets['Feuille 1'] = [];
        }

        $charts = self::extractCharts($workbook);

        return json_encode([
            'sheets' => $sheets,
            'sheetNames' => $sheetNames,
            'cellStyles' => $cellStyles,
            'nativeStyles' => $nativeStyles,
            'sheetMetadata' => $sheetMetadata,
            'charts' => $charts,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

    public static function toFile(string $contents, string $fileName): string
    {
        $data = json_decode($contents, true);
        if (!is_array($data) || !isset($data['sheets'], $data['sheetNames'])) {
            return $contents;
        }

        $workbook = new Spreadsheet();
        $workbook->removeSheetByIndex(0);
        $cellStyles = $data['cellStyles'] ?? [];
        $nativeStyles = $data['nativeStyles'] ?? [];
        $sheetMetadata = $data['sheetMetadata'] ?? [];

        foreach ($data['sheetNames'] as $sheetName) {
            $worksheet = $workbook->createSheet();
            $worksheet->setTitle(substr((string) $sheetName, 0, 31));
            $metadata = $sheetMetadata[$sheetName] ?? [];
            foreach ($metadata['mergedCells'] ?? [] as $mergedCell) {
                $worksheet->mergeCells($mergedCell);
            }
            if (!empty($metadata['freezePane'])) {
                $worksheet->freezePane($metadata['freezePane']);
            }
            foreach ($metadata['columnDimensions'] ?? [] as $column => $dimension) {
                $columnDimension = $worksheet->getColumnDimension($column);
                if (isset($dimension['width']) && $dimension['width'] >= 0) {
                    $columnDimension->setWidth($dimension['width']);
                }
                if (isset($dimension['visible'])) {
                    $columnDimension->setVisible($dimension['visible']);
                }
                if (isset($dimension['outlineLevel'])) {
                    $columnDimension->setOutlineLevel($dimension['outlineLevel']);
                }
            }
            foreach ($metadata['rowDimensions'] ?? [] as $row => $dimension) {
                $rowDimension = $worksheet->getRowDimension((int) $row + 1);
                if (isset($dimension['height']) && $dimension['height'] >= 0) {
                    $rowDimension->setRowHeight($dimension['height']);
                }
                if (isset($dimension['visible'])) {
                    $rowDimension->setVisible($dimension['visible']);
                }
                if (isset($dimension['outlineLevel'])) {
                    $rowDimension->setOutlineLevel($dimension['outlineLevel']);
                }
            }
            $matrix = $data['sheets'][$sheetName] ?? [];

            foreach ($matrix as $rowIndex => $row) {
                foreach ($row as $columnIndex => $value) {
                    $coordinate = Coordinate::stringFromColumnIndex($columnIndex + 1) . ($rowIndex + 1);
                    if ($value !== null && $value !== '') {
                        if (is_string($value) && str_starts_with($value, '=')) {
                            $worksheet->setCellValueExplicit($coordinate, $value, DataType::TYPE_FORMULA);
                        } else {
                            $worksheet->setCellValue($coordinate, $value);
                        }
                    }

                    $style = $cellStyles[$sheetName . '!' . $rowIndex . '_' . $columnIndex] ?? null;
                    if ($style) {
                        $nativeStyle = $nativeStyles[$style['nativeStyleId'] ?? ''] ?? [];
                        $overrides = self::styleOverrides($style);
                        $worksheet->getStyle($coordinate)->applyFromArray(
                            self::mergeStyle($nativeStyle, $overrides)
                        );
                    }
                }
            }
        }

        self::addCharts($workbook, $data['charts'] ?? []);

        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $writerType = match ($extension) {
            'xls' => 'Xls',
            'ods' => 'Ods',
            'csv', 'tsv' => 'Csv',
            default => 'Xlsx',
        };
        $temporaryPath = tempnam(sys_get_temp_dir(), 'proja-sheet-');

        if ($temporaryPath === false) {
            throw new \RuntimeException('Impossible de créer le fichier temporaire du tableur.');
        }

        try {
            $writer = IOFactory::createWriter($workbook, $writerType);
            if ($writerType === 'Csv') {
                $writer->setDelimiter($extension === 'tsv' ? "\t" : ',');
            }
            if (method_exists($writer, 'setPreCalculateFormulas')) {
                $writer->setPreCalculateFormulas(false);
            }
            if (method_exists($writer, 'setIncludeCharts')) {
                $writer->setIncludeCharts(true);
            }
            $writer->save($temporaryPath);
            $result = file_get_contents($temporaryPath);

            if ($result === false) {
                throw new \RuntimeException('Impossible de lire le fichier temporaire du tableur.');
            }

            return $result;
        } finally {
            @unlink($temporaryPath);
            $workbook->disconnectWorksheets();
        }
    }

    private static function toCssColor(?string $argb): ?string
    {
        if (!$argb || strlen($argb) < 6) {
            return null;
        }

        return '#' . substr($argb, -6);
    }

    private static function styleOverrides(array $style): array
    {
        $overrides = [];
        $font = [];
        foreach ([
            'bold' => 'bold',
            'italic' => 'italic',
            'underline' => 'underline',
            'strike' => 'strikethrough',
            'fontSize' => 'size',
            'fontName' => 'name',
        ] as $key => $property) {
            if (array_key_exists($key, $style)) {
                $font[$property] = $style[$key];
            }
        }
        if (isset($style['color'])) {
            $font['color'] = ['rgb' => ltrim($style['color'], '#')];
        }
        if ($font) {
            $overrides['font'] = $font;
        }

        $alignment = [];
        foreach ([
            'align' => 'horizontal',
            'verticalAlign' => 'vertical',
            'wrapText' => 'wrapText',
            'shrinkToFit' => 'shrinkToFit',
            'textRotation' => 'textRotation',
            'indent' => 'indent',
        ] as $key => $property) {
            if (array_key_exists($key, $style)) {
                $alignment[$property] = $style[$key];
            }
        }
        if ($alignment) {
            $overrides['alignment'] = $alignment;
        }
        if (isset($style['numberFormat'])) {
            $overrides['numberFormat'] = ['formatCode' => $style['numberFormat']];
        }
        if (isset($style['bg'])) {
            $overrides['fill'] = [
                'fillType' => 'solid',
                'startColor' => ['rgb' => ltrim($style['bg'], '#')],
            ];
        }
        foreach (['left', 'right', 'top', 'bottom'] as $side) {
            $key = 'border' . ucfirst($side);
            if (isset($style[$key])) {
                $overrides['borders'][$side] = [
                    'borderStyle' => $style[$key]['style'] ?? 'thin',
                    'color' => ['rgb' => ltrim($style[$key]['color'] ?? '#000000', '#')],
                ];
            }
        }

        return $overrides;
    }

    private static function mergeStyle(array $base, array $overrides): array
    {
        foreach ($overrides as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])
                && !in_array($key, ['color', 'startColor', 'endColor'], true)) {
                $base[$key] = self::mergeStyle($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }

    private static function addCharts(Spreadsheet $workbook, array $charts): void
    {
        foreach ($charts as $index => $chartDefinition) {
            $sheetName = $chartDefinition['sheet'] ?? null;
            $range = $chartDefinition['range'] ?? null;
            if (!is_string($sheetName) || !is_string($range)) {
                continue;
            }
            $worksheet = $workbook->getSheetByName($sheetName);
            if (!$worksheet || !preg_match('/^\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/i', $range, $matches)) {
                continue;
            }

            $startColumn = Coordinate::columnIndexFromString(strtoupper($matches[1]));
            $startRow = (int) $matches[2];
            $endColumn = Coordinate::columnIndexFromString(strtoupper($matches[3]));
            $endRow = (int) $matches[4];
            if ($endColumn <= $startColumn || $endRow <= $startRow) {
                continue;
            }

            $plotType = match ($chartDefinition['type'] ?? 'bar') {
                'line' => DataSeries::TYPE_LINECHART,
                'pie' => DataSeries::TYPE_PIECHART,
                default => DataSeries::TYPE_BARCHART,
            };
            $chartType = $chartDefinition['type'] ?? 'bar';
            $seriesLabels = [];
            $categories = [];
            $values = [];
            $seriesCount = $chartType === 'pie' ? 1 : $endColumn - $startColumn;
            $pointCount = $endRow - $startRow;
            $quotedSheet = "'" . str_replace("'", "''", $sheetName) . "'!";
            $firstDataRow = $startRow + 1;
            $lastDataRow = $endRow;
            $categoryColumn = Coordinate::stringFromColumnIndex($startColumn);
            $categories[] = new DataSeriesValues(
                DataSeriesValues::DATASERIES_TYPE_STRING,
                $quotedSheet . '$' . $categoryColumn . '$' . $firstDataRow . ':$' . $categoryColumn . '$' . $lastDataRow,
                null,
                $pointCount
            );

            for ($seriesIndex = 0; $seriesIndex < $seriesCount; $seriesIndex++) {
                $column = Coordinate::stringFromColumnIndex($startColumn + $seriesIndex + 1);
                $seriesLabels[] = new DataSeriesValues(
                    DataSeriesValues::DATASERIES_TYPE_STRING,
                    $quotedSheet . '$' . $column . '$' . $startRow,
                    null,
                    1
                );
                $values[] = new DataSeriesValues(
                    DataSeriesValues::DATASERIES_TYPE_NUMBER,
                    $quotedSheet . '$' . $column . '$' . $firstDataRow . ':$' . $column . '$' . $lastDataRow,
                    null,
                    $pointCount
                );
            }

            $series = new DataSeries(
                $plotType,
                $chartType === 'pie' ? DataSeries::GROUPING_STANDARD : DataSeries::GROUPING_CLUSTERED,
                range(0, $seriesCount - 1),
                $seriesLabels,
                $categories,
                $values
            );
            $chart = new Chart(
                (string) ($chartDefinition['id'] ?? 'Chart ' . ($index + 1)),
                !empty($chartDefinition['title']) ? new \PhpOffice\PhpSpreadsheet\Chart\Title($chartDefinition['title']) : null,
                new Legend(Legend::POSITION_RIGHT, null, false),
                new PlotArea(null, [$series])
            );
            $leftColumn = Coordinate::stringFromColumnIndex($endColumn + 2);
            $topRow = 2 + (($index % 2) * 18);
            $chart->setTopLeftPosition($leftColumn . $topRow);
            $chart->setBottomRightPosition(
                Coordinate::stringFromColumnIndex($endColumn + 12) . ($topRow + 16)
            );
            $worksheet->addChart($chart);
        }
    }

    private static function extractCharts(Spreadsheet $workbook): array
    {
        $charts = [];
        foreach ($workbook->getWorksheetIterator() as $worksheet) {
            foreach ($worksheet->getChartCollection() as $chartIndex => $chart) {
                $plotArea = $chart->getPlotArea();
                if (!$plotArea) {
                    continue;
                }

                foreach ($plotArea->getPlotGroup() as $groupIndex => $series) {
                    $type = match ($series->getPlotType()) {
                        DataSeries::TYPE_BARCHART => 'bar',
                        DataSeries::TYPE_LINECHART => 'line',
                        DataSeries::TYPE_PIECHART => 'pie',
                        default => null,
                    };
                    if ($type === null) {
                        continue;
                    }

                    $category = $series->getPlotCategoryByIndex(0);
                    $categoryReference = $category ? self::parseChartReference($category->getDataSource()) : null;
                    $valueReferences = [];
                    foreach ($series->getPlotValues() as $plotValues) {
                        $reference = self::parseChartReference($plotValues->getDataSource());
                        if ($reference) {
                            $valueReferences[] = $reference;
                        }
                    }
                    $labelReferences = [];
                    foreach ($series->getPlotLabels() as $plotLabel) {
                        $reference = self::parseChartReference($plotLabel->getDataSource());
                        if ($reference) {
                            $labelReferences[] = $reference;
                        }
                    }
                    if (!$categoryReference || !$valueReferences || !$labelReferences) {
                        continue;
                    }

                    $sheet = $categoryReference['sheet'];
                    if (array_filter(
                        array_merge($valueReferences, $labelReferences),
                        static fn (array $reference): bool => strcasecmp($reference['sheet'], $sheet) !== 0
                    )) {
                        continue;
                    }

                    $startColumn = Coordinate::columnIndexFromString($categoryReference['startColumn']);
                    $endColumn = max(array_map(
                        static fn (array $reference): int => Coordinate::columnIndexFromString($reference['endColumn']),
                        $valueReferences
                    ));
                    $startRow = min(array_map(
                        static fn (array $reference): int => $reference['startRow'],
                        $labelReferences
                    ));
                    $endRow = max(array_map(
                        static fn (array $reference): int => $reference['endRow'],
                        $valueReferences
                    ));
                    if ($endColumn <= $startColumn || $endRow <= $startRow) {
                        continue;
                    }

                    $title = $chart->getTitle()?->getCaptionText() ?? '';
                    $charts[] = [
                        'id' => 'imported-' . $worksheet->getTitle() . '-' . $chartIndex . '-' . $groupIndex,
                        'type' => $type,
                        'title' => $title,
                        'sheet' => $sheet,
                        'range' => Coordinate::stringFromColumnIndex($startColumn) . $startRow
                            . ':' . Coordinate::stringFromColumnIndex($endColumn) . $endRow,
                    ];
                }
            }
        }

        return $charts;
    }

    private static function parseChartReference(?string $source): ?array
    {
        if (!$source || !preg_match(
            '/^(?:\'((?:[^\']|\'\')+)\'|([^!]+))!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i',
            ltrim($source, '='),
            $matches
        )) {
            return null;
        }

        return [
            'sheet' => str_replace("''", "'", $matches[1] !== '' ? $matches[1] : trim($matches[2], "'")),
            'startColumn' => strtoupper($matches[3]),
            'startRow' => (int) $matches[4],
            'endColumn' => strtoupper(($matches[5] ?? '') ?: $matches[3]),
            'endRow' => (int) (($matches[6] ?? '') ?: $matches[4]),
        ];
    }
}
