<?php

namespace App\Support;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

final class SpreadsheetFile
{
    public static function fromFile(string $path, string $contents): string
    {
        $data = json_decode($contents, true);
        if (is_array($data) && isset($data['sheets'], $data['sheetNames'])) {
            return $contents;
        }

        $workbook = IOFactory::load($path);
        $sheets = [];
        $cellStyles = [];
        $sheetNames = [];

        foreach ($workbook->getWorksheetIterator() as $worksheet) {
            $sheetName = $worksheet->getTitle();
            $sheetNames[] = $sheetName;
            $sheets[$sheetName] = array_map(
                static fn (array $row): array => array_map(
                    static fn ($value) => $value ?? '',
                    $row
                ),
                $worksheet->toArray(null, false, true, false)
            );

            foreach ($worksheet->getCellCollection()->getCoordinates() as $coordinate) {
                $style = $worksheet->getStyle($coordinate);
                $font = $style->getFont();
                $alignment = $style->getAlignment();
                $fill = $style->getFill();
                $cellStyle = [];

                if ($font->getBold()) {
                    $cellStyle['bold'] = true;
                }
                if ($font->getItalic()) {
                    $cellStyle['italic'] = true;
                }
                if ($font->getStrikethrough()) {
                    $cellStyle['strike'] = true;
                }
                if ($font->getSize() !== 11) {
                    $cellStyle['fontSize'] = $font->getSize();
                }
                if ($alignment->getHorizontal() !== 'general') {
                    $horizontal = $alignment->getHorizontal();
                    $cellStyle['align'] = match ($horizontal) {
                        'left', 'center', 'right', 'justify' => $horizontal,
                        'centerContinuous' => 'center',
                        'distributed' => 'justify',
                        default => null,
                    };
                    if ($cellStyle['align'] === null) {
                        unset($cellStyle['align']);
                    }
                }

                $fontColor = $font->getColor()->getRGB();
                if ($fontColor && strtoupper($fontColor) !== '000000') {
                    $cellStyle['color'] = '#' . $fontColor;
                }

                $fillColor = $fill->getStartColor()->getRGB();
                if ($fill->getFillType() === Fill::FILL_SOLID && $fillColor && strtoupper($fillColor) !== 'FFFFFF') {
                    $cellStyle['bg'] = '#' . $fillColor;
                }

                $numberFormat = $style->getNumberFormat()->getFormatCode();
                if ($numberFormat !== 'General') {
                    $cellStyle['numberFormat'] = $numberFormat;
                }

                if ($cellStyle) {
                    [$column, $row] = Coordinate::coordinateFromString($coordinate);
                    $key = $sheetName . '!' . ((int) $row - 1) . '_' . (Coordinate::columnIndexFromString($column) - 1);
                    $cellStyles[$key] = $cellStyle;
                }
            }
        }

        if (!$sheetNames) {
            $sheetNames = ['Feuille 1'];
            $sheets['Feuille 1'] = [];
        }

        return json_encode([
            'sheets' => $sheets,
            'sheetNames' => $sheetNames,
            'cellStyles' => $cellStyles,
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

        foreach ($data['sheetNames'] as $sheetName) {
            $worksheet = $workbook->createSheet();
            $worksheet->setTitle(substr((string) $sheetName, 0, 31));
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
                        $worksheet->getStyle($coordinate)->applyFromArray([
                            'font' => array_filter([
                                'bold' => $style['bold'] ?? null,
                                'italic' => $style['italic'] ?? null,
                                'strikethrough' => $style['strike'] ?? null,
                                'size' => $style['fontSize'] ?? null,
                                'color' => isset($style['color']) ? ['rgb' => ltrim($style['color'], '#')] : null,
                            ], static fn ($value) => $value !== null),
                            'alignment' => isset($style['align']) ? ['horizontal' => $style['align']] : [],
                            'numberFormat' => isset($style['numberFormat']) ? ['formatCode' => $style['numberFormat']] : [],
                            'fill' => isset($style['bg']) ? [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => ltrim($style['bg'], '#')],
                            ] : [],
                        ]);
                    }
                }
            }
        }

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
}
