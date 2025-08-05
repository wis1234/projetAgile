<?php

use Illuminate\Support\Facades\Storage;

if (!function_exists('is_file_editable')) {
    /**
     * Vérifie si un fichier est éditable en fonction de son type MIME ou de son extension
     *
     * @param string|null $mimeType Le type MIME du fichier
     * @param string $fileName Le nom du fichier avec extension
     * @return bool True si le fichier est éditable
     */
    function is_file_editable($mimeType, $fileName)
    {
        if (empty($mimeType) && empty($fileName)) {
            return false;
        }

        // Liste des types MIME éditables
        $editableMimeTypes = [
            'text/plain',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'application/json',
            'application/xml',
            'application/x-httpd-php',
            'application/x-sh',
            'application/x-yaml',
            'application/xml',
            'text/x-python',
            'text/x-java',
            'text/x-c',
            'text/x-c++',
            'text/x-csharp',
            'text/x-ruby',
            'text/x-perl',
            'text/x-swift',
            'text/x-go',
            'text/x-kotlin',
            'text/x-scala',
            'text/x-rust',
            'text/x-typescript',
            'text/x-sql',
            'text/markdown',
            'text/x-markdown',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
        ];

        // Liste des extensions éditables (au cas où le type MIME n'est pas fiable)
        $editableExtensions = [
            'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'conf',
            'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less', 'styl',
            'js', 'jsx', 'ts', 'tsx', 'coffee', 'mjs', 'cjs',
            'php', 'py', 'rb', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'scala',
            'sql', 'ps1', 'bat', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'cmd',
            'vue', 'svelte', 'handlebars', 'hbs', 'pug', 'jade', 'ejs', 'twig',
            'docx', 'doc', 'rtf',
        ];

        // Vérifier le type MIME
        $mimeType = strtolower($mimeType ?? '');
        foreach ($editableMimeTypes as $type) {
            if (str_contains($mimeType, $type)) {
                return true;
            }
        }

        // Vérifier l'extension du fichier
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        return in_array(strtolower($extension), $editableExtensions);
    }
}

if (!function_exists('is_pdf_file')) {
    /**
     * Vérifie si un fichier est un PDF
     *
     * @param string|null $mimeType Le type MIME du fichier
     * @param string $fileName Le nom du fichier avec extension
     * @return bool True si le fichier est un PDF
     */
    function is_pdf_file($mimeType, $fileName)
    {
        if ($mimeType === 'application/pdf') {
            return true;
        }
        
        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
        return strtolower($extension) === 'pdf';
    }
}
