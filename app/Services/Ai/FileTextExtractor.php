<?php

namespace App\Services\Ai;

use App\Models\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Extraction de texte des fichiers ProJA pour l'assistant.
 * Formats : texte/HTML/CSV/JSON/Markdown, Word (.docx), PowerPoint (.pptx), Excel/CSV (.xlsx/.xls via PhpSpreadsheet),
 * OpenDocument (.odt), PDF (si l'outil `pdftotext` est installé sur le serveur). Les images et archives ne sont pas lues.
 */
class FileTextExtractor
{
    public const MAX_BYTES = 15 * 1024 * 1024;     // au-delà : on ne tente pas de lire
    public const MAX_CHARS = 400000;               // texte conservé en cache par fichier

    private const PLAIN = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'yml', 'yaml', 'log', 'css', 'js', 'ts', 'jsx', 'tsx', 'php', 'py', 'sql', 'ini', 'env.example'];

    public static function extension(File $file): string
    {
        return strtolower(pathinfo((string) $file->name, PATHINFO_EXTENSION) ?: pathinfo((string) $file->file_path, PATHINFO_EXTENSION));
    }

    public static function absolutePath(File $file): ?string
    {
        if (empty($file->file_path)) {
            return null;
        }
        $rel = preg_replace('#^public/#', '', $file->file_path);
        $path = Storage::disk('public')->path($rel);
        return is_file($path) ? $path : null;
    }

    /** Peut-on espérer en tirer du texte ? (sans l'ouvrir) */
    public static function supports(File $file): bool
    {
        $ext = self::extension($file);
        $type = (string) $file->type;
        return in_array($ext, array_merge(self::PLAIN, ['html', 'htm', 'docx', 'pptx', 'xlsx', 'xls', 'odt', 'pdf']), true)
            || str_starts_with($type, 'text/')
            || in_array($type, ['application/json', 'application/xml'], true);
    }

    /**
     * @return array{text:?string, error:?string}
     */
    public function extract(File $file): array
    {
        $path = self::absolutePath($file);
        if (!$path) {
            return ['text' => null, 'error' => "Le fichier n'est plus présent sur le serveur."];
        }
        if (filesize($path) > self::MAX_BYTES) {
            return ['text' => null, 'error' => 'Fichier trop volumineux pour être lu (15 Mo maximum).'];
        }
        if (!self::supports($file)) {
            return ['text' => null, 'error' => "Ce type de fichier ({$file->type}) ne peut pas être lu comme du texte."];
        }

        $key = 'ai:file:' . $file->id . ':' . filemtime($path) . ':' . filesize($path);
        $cached = Cache::get($key);
        if (is_array($cached)) {
            return $cached;
        }

        try {
            $result = $this->read($file, $path);
        } catch (\Throwable $e) {
            \Log::warning('AI file extract failed', ['file' => $file->id, 'error' => $e->getMessage()]);
            $result = ['text' => null, 'error' => 'Lecture impossible (fichier endommagé ou protégé).'];
        }

        if ($result['text'] !== null) {
            $result['text'] = mb_substr($result['text'], 0, self::MAX_CHARS);
            Cache::put($key, $result, 600);
        }
        return $result;
    }

    private function read(File $file, string $path): array
    {
        $ext = self::extension($file);

        if ($ext === 'html' || $ext === 'htm' || $file->type === 'text/html') {
            return $this->ok(self::htmlToText((string) file_get_contents($path)));
        }
        if ($ext === 'docx') {
            return $this->ok($this->zipXmlText($path, ['word/document.xml'], ['</w:p>' => "\n", '<w:tab/>' => "\t", '<w:br/>' => "\n"]));
        }
        if ($ext === 'odt') {
            return $this->ok($this->zipXmlText($path, ['content.xml'], ['</text:p>' => "\n", '</text:h>' => "\n"]));
        }
        if ($ext === 'pptx') {
            $zip = new \ZipArchive();
            if ($zip->open($path) !== true) {
                return ['text' => null, 'error' => 'Présentation illisible.'];
            }
            $slides = [];
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $n = $zip->getNameIndex($i);
                if (preg_match('#^ppt/slides/slide(\d+)\.xml$#', $n, $m)) {
                    $slides[(int) $m[1]] = $zip->getFromIndex($i);
                }
            }
            $zip->close();
            ksort($slides);
            $out = [];
            foreach ($slides as $num => $xml) {
                preg_match_all('#<a:t>(.*?)</a:t>#s', $xml, $mm);
                $out[] = "--- Diapositive {$num} ---\n" . html_entity_decode(implode("\n", $mm[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
            }
            return $this->ok(implode("\n\n", $out));
        }
        if ($ext === 'xlsx' || $ext === 'xls') {
            return $this->ok($this->spreadsheetText($path));
        }
        if ($ext === 'pdf') {
            return $this->pdfText($path);
        }

        $raw = (string) file_get_contents($path);
        if (!mb_check_encoding($raw, 'UTF-8')) {
            $raw = mb_convert_encoding($raw, 'UTF-8', 'ISO-8859-1');
        }
        return $this->ok($raw);
    }

    private function ok(string $text): array
    {
        $text = trim(preg_replace("/[ \t]+\n/", "\n", preg_replace("/\n{3,}/", "\n\n", str_replace("\r", '', $text))));
        return ['text' => $text, 'error' => null];
    }

    /** HTML → texte lisible (titres, listes et paragraphes séparés par des retours à la ligne). */
    public static function htmlToText(string $html): string
    {
        $html = preg_replace('#<(script|style)[^>]*>.*?</\1>#si', '', $html);
        $html = preg_replace('#<(br|/p|/div|/h[1-6]|/li|/tr|/blockquote)\s*/?>#i', "\n", $html);
        $html = preg_replace('#<li[^>]*>#i', '• ', $html);
        $html = preg_replace('#</t[dh]>#i', "\t", $html);
        return html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function zipXmlText(string $path, array $entries, array $breaks): string
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return '';
        }
        $out = '';
        foreach ($entries as $e) {
            $xml = $zip->getFromName($e);
            if ($xml !== false) {
                $out .= html_entity_decode(strip_tags(strtr($xml, $breaks)), ENT_QUOTES | ENT_XML1, 'UTF-8') . "\n";
            }
        }
        $zip->close();
        return $out;
    }

    private function spreadsheetText(string $path): string
    {
        if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            return '';
        }
        $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $book = $reader->load($path);
        $out = [];
        foreach ($book->getWorksheetIterator() as $sheet) {
            $out[] = '--- Feuille : ' . $sheet->getTitle() . ' ---';
            $rows = 0;
            foreach ($sheet->toArray(null, true, true, false) as $row) {
                $cells = array_map(fn ($c) => is_scalar($c) || $c === null ? (string) $c : '', array_slice($row, 0, 40));
                if (trim(implode('', $cells)) === '') {
                    continue;
                }
                $out[] = implode(' | ', $cells);
                if (++$rows >= 1000) {
                    $out[] = '… (feuille tronquée à 1000 lignes)';
                    break;
                }
            }
        }
        return implode("\n", $out);
    }

    private function pdfText(string $path): array
    {
        if (!function_exists('shell_exec') || in_array('shell_exec', array_map('trim', explode(',', (string) ini_get('disable_functions'))), true)) {
            return ['text' => null, 'error' => 'Lecture des PDF indisponible sur ce serveur (shell_exec désactivé).'];
        }
        $bin = trim((string) @shell_exec('command -v pdftotext 2>/dev/null'));
        if ($bin === '') {
            return ['text' => null, 'error' => "Lecture des PDF indisponible : installez « poppler-utils » (pdftotext) sur le serveur."];
        }
        $out = (string) @shell_exec(escapeshellcmd($bin) . ' -layout -enc UTF-8 ' . escapeshellarg($path) . ' - 2>/dev/null');
        return trim($out) === '' ? ['text' => null, 'error' => "Ce PDF ne contient pas de texte extractible (scan ?)."] : $this->ok($out);
    }
}
