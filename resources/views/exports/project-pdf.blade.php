<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Suivi Global - {{ $project->name }}</title>
    <style type="text/css">
        /* Reset et configuration de base */
        * { 
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        
        @page {
            margin: 1.5cm 2cm 2.5cm 2cm;
            font-family: 'DejaVu Sans', sans-serif;
            size: A4 portrait;
        }
        @page {
            margin: 1.5cm 1.5cm 2cm 1.5cm;
            font-family: 'DejaVu Sans', sans-serif;
        }
        
        body {
            font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #3490dc;
            padding-bottom: 8px;
            page-break-after: avoid;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 14px;
            color: #718096;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #2d3748;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .task {
            margin-bottom: 15px;
            page-break-inside: avoid;
            page-break-after: auto;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 10px;
            background: #fff;
        }
        .task-title {
            font-weight: bold;
            color: #2b6cb0;
            margin-bottom: 5px;
        }
        .task-meta {
            font-size: 11px;
            color: #718096;
            margin-bottom: 5px;
        }
        .task-description {
            margin: 10px 0;
            padding: 12px;
            background-color: #f8fafc;
            border-left: 4px solid #3490dc;
            border-radius: 0 4px 4px 0;
            font-size: 10pt;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            page-break-inside: avoid;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #a0aec0;
            border-top: 1px solid #e2e8f0;
            padding: 5px 0;
            background: white;
        }
        .page-break {
            page-break-after: always;
            page-break-before: avoid;
            height: 0;
            margin: 0;
            padding: 0;
            border: none;
        }
        
        /* Éviter les coupures de mots */
        p, div, span, td {
            word-wrap: break-word;
            overflow-wrap: break-word;
            -webkit-hyphens: auto;
            -ms-hyphens: auto;
            hyphens: auto;
        }
        
        /* Style pour les images */
        img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
            page-break-after: auto;
        }
        
        /* Style pour les tableaux */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            text-align: left;
            font-size: 9pt;
        }
        
        th {
            background-color: #f7fafc;
            font-weight: bold;
        }
        .files-list {
            margin: 10px 0 5px 15px;
            padding: 8px;
            background: #f9fafb;
            border-radius: 4px;
            page-break-inside: avoid;
        }
        .file-item {
            font-size: 9pt;
            color: #4a5568;
            margin: 5px 0;
            padding: 4px 8px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 3px;
            page-break-inside: avoid;
        }
        
        /* Styles pour le contenu des fichiers texte */
        .file-content {
            margin: 10px 0 0 15px;
            padding: 10px;
            background: #f8f9fa;
            border: 1px dashed #d1d5db;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 300px;
            overflow: auto;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SUIVI GLOBAL DU PROJET</div>
        <div class="subtitle">{{ $project->name }}</div>
        <div>Généré le: {{ $generated_at }}</div>
    </div>

    <div class="section">
        <div class="section-title">Description du projet</div>
        <div>{!! nl2br(e($project->description)) !!}</div>
    </div>

    <div class="section">
        <div class="section-title">Tâches du projet</div>
        
        @foreach($tasks as $index => $task)
            <div class="task">
                <div class="task-title">Tâche #{{ $index + 1 }}: {{ $task->title }}</div>
                <div class="task-meta">
                    Statut: {{ ucfirst($task->status) }} | 
                    Priorité: {{ ucfirst($task->priority) }} | 
                    Assigné à: {{ $task->assignedUser ? $task->assignedUser->name : 'Non assigné' }} | 
                    Échéance: {{ $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie' }}
                </div>
                
                @if($task->description)
                    <div class="task-description">
                        {!! nl2br(e($task->description)) !!}
                    </div>
                @endif
                
                @if($task->files->isNotEmpty())
                    <div class="files-list">
                        <div style="font-weight: bold; margin: 5px 0;">Fichiers liés:</div>
                        @foreach($task->files as $file)
                            <div class="file-item">
                                • {{ $file->name }} 
                                ({{ $file->type }}, {{ $file->size > 0 ? number_format($file->size / 1024, 2) . ' Ko' : 'Taille inconnue' }}, 
                                mis à jour le: {{ $file->updated_at->format('d/m/Y H:i') }})
                                @php
                                    $compressedTypes = [
                                        'application/zip',
                                        'application/x-rar-compressed',
                                        'application/x-7z-compressed',
                                        'application/x-tar',
                                        'application/x-gzip',
                                        'application/x-bzip2',
                                        'application/java-archive',
                                        'application/x-apple-diskimage'
                                    ];
                                    
                                    $isCompressed = in_array($file->type, $compressedTypes);
                                    $isText = str_starts_with($file->type, 'text/');
                                    // Types de documents texte
                                    $isDocument = in_array($file->type, [
                                        'application/pdf',
                                        'application/msword',
                                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        'application/vnd.ms-excel',
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                        'application/vnd.ms-powerpoint',
                                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                        'application/rtf',
                                        'application/xml',
                                        'application/json',
                                        'application/x-yaml',
                                        'application/x-csv',
                                        'text/csv',
                                        'text/plain',
                                        'text/html',
                                        'text/css',
                                        'text/javascript',
                                        'application/javascript',
                                        'application/x-httpd-php',
                                        'application/x-sh',
                                        'application/x-bat',
                                        'application/x-csh',
                                        'application/x-python',
                                        'application/x-ruby',
                                        'application/x-perl',
                                        'application/x-java',
                                        'application/x-c',
                                        'application/x-c++',
                                        'application/x-httpd-php-source',
                                        'application/x-httpd-php',
                                        'application/sql',
                                        'application/x-sql',
                                        'application/x-sql-query',
                                        'application/x-sql-script',
                                        'application/x-sql-query',
                                        'application/x-sql-query'
                                    ]);
                                    
                                    // Types d'images supportées
                                    $isImage = in_array($file->type, [
                                        'image/jpeg',
                                        'image/png',
                                        'image/gif',
                                        'image/bmp',
                                        'image/svg+xml',
                                        'image/webp',
                                        'image/tiff',
                                        'image/x-icon'
                                    ]);
                                    
                                    $canDisplay = $isText || $isDocument || $isImage;
                                    
                                    $canDisplay = $isText || $isDocument;
                                @endphp
                                
                                @if($isImage)
                                    @php
                                        try {
                                            $imagePath = storage_path('app/public/' . $file->file_path);
                                            if (file_exists($imagePath)) {
                                                $imageData = base64_encode(file_get_contents($imagePath));
                                                $imageSrc = 'data:' . $file->type . ';base64,' . $imageData;
                                            } else {
                                                throw new Exception('Fichier image introuvable');
                                            }
                                        } catch (\Exception $e) {
                                            $imageError = true;
                                        }
                                    @endphp
                                    
                                    @if(isset($imageError))
                                        <div style="margin-left: 15px; font-style: italic; color: #dc3545;">
                                            (Erreur lors du chargement de l'image)
                                        </div>
                                    @else
                                        <div style="margin: 10px 0 15px 20px; max-width: 100%;">
                                            <img src="{{ $imageSrc }}" 
                                                 style="max-width: 100%; max-height: 300px; display: block; margin: 5px 0;" 
                                                 alt="{{ $file->name }}" />
                                            <div style="font-size: 9px; color: #6c757d; margin-top: 2px;">
                                                {{ $file->name }} ({{ $file->type }}, {{ $file->size > 0 ? number_format($file->size / 1024, 2) . ' Ko' : 'Taille inconnue' }})
                                            </div>
                                        </div>
                                    @endif
                                    
                                @elseif(!$isCompressed && $canDisplay)
                                    @php
                                        try {
                                            $content = Storage::disk('public')->get($file->file_path);
                                            
                                            // Supprimer les balises HTML tout en conservant le formatage de base
                                            $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                                            
                                            // Remplacer les listes HTML par un format texte
                                            $content = preg_replace('/<ul[^>]*>/', "\n", $content);
                                            $content = preg_replace('/<ol[^>]*>/', "\n", $content);
                                            $content = preg_replace('/<li[^>]*>/', "• ", $content);
                                            
                                            // Remplacer les balises de paragraphe par des sauts de ligne
                                            $content = str_replace(['</p>', '<p>', '</div>', '<br>', '<br/>', '<br />'], "\n", $content);
                                            
                                            // Supprimer toutes les autres balises HTML
                                            $content = strip_tags($content);
                                            
                                            // Nettoyer les espaces et sauts de ligne multiples
                                            $content = preg_replace(['/\s*\n\s*/', '/[\r\n]+/', '/\s{2,}/'], ["\n", "\n", ' '], $content);
                                            
                                            // Limiter la longueur tout en préservant les mots complets
                                            $content = Str::of($content)->words(200, '... [contenu tronqué]');
                                            
                                            // Ajouter une indentation pour les listes
                                            $lines = explode("\n", $content);
                                            $formattedLines = [];
                                            $inList = false;
                                            
                                            foreach ($lines as $line) {
                                                $trimmed = trim($line);
                                                if (str_starts_with($trimmed, '•')) {
                                                    $formattedLines[] = '  ' . $trimmed;
                                                    $inList = true;
                                                } else {
                                                    if ($inList && !empty($trimmed)) {
                                                        $formattedLines[count($formattedLines) - 1] .= ' ' . $trimmed;
                                                    } else {
                                                        $formattedLines[] = $trimmed;
                                                    }
                                                    $inList = false;
                                                }
                                            }
                                            
                                            $content = implode("\n", $formattedLines);
                                            
                                            // Échapper le contenu pour la sécurité
                                            $content = htmlspecialchars($content, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
                                            
                                        } catch (\Exception $e) {
                                            $content = '[Impossible de lire le contenu du fichier]';
                                        }
                                    @endphp
                                    <div class="file-content" style="
                                        margin: 10px 0 15px 20px; 
                                        padding: 10px; 
                                        background: #f8f9fa; 
                                        border: 1px solid #dee2e6;
                                        border-radius: 4px;
                                        font-size: 10px; 
                                        line-height: 1.4;
                                        white-space: pre-wrap; 
                                        font-family: 'DejaVu Sans', 'Arial Unicode MS', sans-serif; 
                                        max-height: 250px; 
                                        overflow: auto;
                                        color: #212529;
                                    ">
                                        {!! nl2br(e($content)) !!}
                                    </div>
                                @elseif($isCompressed)
                                    <div style="margin-left: 15px; font-style: italic; color: #4a5568;">
                                        (Fichier compressé - non affiché dans cette version PDF)
                                    </div>
                                @else
                                    <div style="margin-left: 15px; font-style: italic; color: #4a5568;">
                                        (Type de fichier non pris en charge pour l'affichage - {{ $file->type }})
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
            
            @if(($index + 1) % 5 == 0 && ($index + 1) < count($tasks))
                <div class="page-break"></div>
            @endif
        @endforeach
    </div>
    
    <div class="footer">
        Document généré par Agile Manager • {{ $generated_at }} • Page {PAGENO} sur {nbpg}
    </div>
</body>
</html>
