import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FaArrowLeft, 
    FaDownload, 
    FaFilePdf, 
    FaFileWord, 
    FaFileImage,
    FaFileAlt,
    FaCheckCircle, 
    FaTimesCircle,
    FaUserCheck,
    FaUserClock,
    FaUserTie,
    FaUser,
    FaUserTimes,
    FaEye,
    FaInfoCircle,
    FaListUl,
    FaCheckSquare,
    FaCircle,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaClock,
    FaTimes,
    FaExpand,
    FaCompress,
    FaPaperclip,
    FaClipboard,
    FaClipboardCheck,
    FaBriefcase,
    FaMapMarkerAlt,
    FaFileContract,
    FaCalendarPlus,
    FaChevronLeft,
    FaChevronRight,
    FaSearchPlus,
    FaSearchMinus,
    FaExclamationTriangle
} from 'react-icons/fa';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuration de pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Fonction utilitaire pour formater la taille du fichier
function formatFileSize(bytes) {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

const statusIcons = {
    pending: { 
        icon: <FaClock className="h-4 w-4" />,
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800',
    },
    reviewed: {
        icon: <FaEye className="h-4 w-4" />,
        label: 'Examinée',
        color: 'bg-blue-100 text-blue-800',
    },
    interviewed: {
        icon: <FaUserTie className="h-4 w-4" />,
        label: 'En entretien',
        color: 'bg-purple-100 text-purple-800',
    },
    accepted: {
        icon: <FaCheckCircle className="h-4 w-4" />,
        label: 'Acceptée',
        color: 'bg-green-100 text-green-800',
    },
    rejected: {
        icon: <FaTimesCircle className="h-4 w-4" />,
        label: 'Rejetée',
        color: 'bg-red-100 text-red-800',
    },
};

// Composant pour l'aperçu des fichiers
const FilePreview = ({ file, onClose }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const previewRef = useRef(null);
    
    // Créer une URL complète pour le fichier
    const getFileUrl = () => {
        if (!file) return '';
        const fileUrl = file.downloadUrl || file.url || '';
        return fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
    };
    
    const fileUrl = getFileUrl();

    // Gestion du plein écran
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await previewRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Erreur lors du passage en plein écran:', err);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setError(null);
        setIsLoading(false);
    };

    const onDocumentLoadError = (error) => {
        console.error('Error loading PDF:', error);
        setError('Impossible de charger le document. Veuillez le télécharger pour le consulter.');
        setIsLoading(false);
    };

    // Navigation entre les pages pour les PDF
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    // Gestion du zoom
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    // Réinitialiser l'état lors du changement de fichier
    useEffect(() => {
        setCurrentPage(1);
        setScale(1.0);
        setError(null);
        setIsLoading(true);
    }, [file]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                ref={previewRef}
                className={`bg-white rounded-lg shadow-xl overflow-hidden ${isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-[90vh]'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* En-tête avec boutons de contrôle */}
                <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-gray-700 rounded-full"
                            title="Fermer"
                        >
                            <FaTimes className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium truncate max-w-xs">{file.fileName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Boutons de contrôle pour PDF */}
                        {file.fileType === 'pdf' && (
                            <div className="flex items-center bg-gray-700 rounded-md px-2 py-1">
                                <button 
                                    onClick={prevPage} 
                                    disabled={currentPage <= 1}
                                    className="p-1 disabled:opacity-30"
                                    title="Page précédente"
                                >
                                    <FaChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="mx-2 text-sm">
                                    Page {currentPage} sur {numPages || '...'}
                                </span>
                                <button 
                                    onClick={nextPage} 
                                    disabled={currentPage >= (numPages || 1)}
                                    className="p-1 disabled:opacity-30"
                                    title="Page suivante"
                                >
                                    <FaChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        
                        {/* Boutons de zoom */}
                        <div className="flex items-center bg-gray-700 rounded-md overflow-hidden">
                            <button 
                                onClick={zoomOut}
                                className="p-1 hover:bg-gray-600"
                                title="Zoom arrière"
                            >
                                <FaSearchMinus className="h-4 w-4" />
                            </button>
                            <span className="px-2 text-sm">{Math.round(scale * 100)}%</span>
                            <button 
                                onClick={zoomIn}
                                className="p-1 hover:bg-gray-600"
                                title="Zoom avant"
                            >
                                <FaSearchPlus className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Bouton plein écran */}
                        <button 
                            onClick={toggleFullscreen}
                            className="p-1 hover:bg-gray-700 rounded-full"
                            title={isFullscreen ? "Quitter le mode plein écran" : "Plein écran"}
                        >
                            {isFullscreen ? (
                                <FaCompress className="h-4 w-4" />
                            ) : (
                                <FaExpand className="h-4 w-4" />
                            )}
                        </button>

                        {/* Bouton de téléchargement */}
                        <a 
                            href={file.downloadUrl}
                            download={file.fileName}
                            className="p-1 hover:bg-gray-700 rounded-full"
                            title="Télécharger"
                            onClick={e => e.stopPropagation()}
                        >
                            <FaDownload className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* Contenu de l'aperçu */}
                <div className="flex-1 overflow-auto p-4 flex justify-center items-center bg-gray-100">
                    {file.fileType === 'pdf' ? (
                        <div className="relative">
                            <Document
                                file={{
                                    url: fileUrl,
                                    httpHeaders: {
                                        'Accept': 'application/pdf',
                                        'X-Requested-With': 'XMLHttpRequest',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                                        'Cache-Control': 'no-cache',
                                    },
                                    withCredentials: true,
                                    ...file.headers
                                }}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={
                                    <div className="flex flex-col items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                                        <p>Chargement du PDF...</p>
                                    </div>
                                }
                                options={{
                                    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                                    cMapPacked: true,
                                    httpHeaders: {
                                        'Accept': 'application/pdf',
                                        'X-Requested-With': 'XMLHttpRequest',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                                        'Cache-Control': 'no-cache',
                                    },
                                    withCredentials: true,
                                }}
                            >
                                <Page 
                                    pageNumber={currentPage} 
                                    scale={scale}
                                    width={Math.min(800, window.innerWidth - 100)}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-lg"
                                />
                            </Document>
                            {error && (
                                <div className="absolute inset-0 bg-red-50 border border-red-200 rounded p-4 flex items-center justify-center">
                                    <FaExclamationTriangle className="text-red-500 mr-2" />
                                    <span className="text-red-700">{error}</span>
                                </div>
                            )}
                        </div>
                    ) : file.fileType === 'image' ? (
                        <div className="max-w-full max-h-[calc(100vh-200px)] overflow-auto">
                            <img 
                                src={file.downloadUrl} 
                                alt={`Aperçu de ${file.fileName}`}
                                className="max-w-full max-h-full object-contain"
                                style={{ transform: `scale(${scale})` }}
                            />
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <FaFileAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-gray-500">Aperçu non disponible pour ce type de fichier</p>
                            <a 
                                href={file.downloadUrl}
                                download={file.fileName}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={e => e.stopPropagation()}
                            >
                                <FaDownload className="mr-2 h-4 w-4" />
                                Télécharger le fichier
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Fonction utilitaire pour obtenir l'icône en fonction du type de champ
function getFieldTypeIcon(fieldType) {
    switch (fieldType) {
        case 'text':
            return <FaFileAlt className="h-4 w-4 text-gray-400" />;
        case 'textarea':
            return <FaFileAlt className="h-4 w-4 text-blue-400" />;
        case 'number':
            return <span className="text-purple-500 font-bold">#</span>;
        case 'email':
            return <FaEnvelope className="h-4 w-4 text-blue-500" />;
        case 'tel':
            return <FaPhone className="h-4 w-4 text-green-500" />;
        case 'date':
            return <FaCalendarAlt className="h-4 w-4 text-yellow-500" />;
        case 'select':
            return <FaListUl className="h-4 w-4 text-indigo-500" />;
        case 'checkbox':
            return <FaCheckSquare className="h-4 w-4 text-green-500" />;
        case 'radio':
            return <FaCircle className="h-3 w-3 text-blue-500" />;
        case 'file':
            return <FaFileAlt className="h-4 w-4 text-gray-500" />;
        default:
            return <FaInfoCircle className="h-4 w-4 text-gray-400" />;
    }
}

// Composant pour afficher la valeur d'un champ personnalisé
function CustomFieldValue({ field, applicationId, recruitmentId }) {
    const [showPreview, setShowPreview] = useState(false);
    
    // Vérifier si le champ ou sa valeur est vide
    if (!field || field.value === null || field.value === undefined || field.value === '') {
        return <span className="text-gray-400 italic">Non renseigné</span>;
    }

    // Gestion des différents types de champs
    switch (field.field_type) {
        case 'file':
            if (!field.file_url) {
                return <span className="text-gray-400 italic">Aucun fichier</span>;
            }
            
            // Si c'est un fichier, on peut avoir soit un chemin direct, soit un objet avec file_name
            const fileName = typeof field.value === 'object' && field.value.file_name 
                ? field.value.file_name 
                : field.value.split('/').pop();
                
            const fileExt = fileName.split('.').pop().toLowerCase();
            const isPdf = fileExt === 'pdf';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
            const isPreviewable = isPdf || isImage;
            
            // URL de téléchargement via la route dédiée
            const fileUrl = route('recruitment.applications.download.custom', {
                recruitment: recruitmentId,
                application: applicationId,
                fieldName: field.field_name
            });
            
            // Obtenir l'URL de la miniature ou utiliser l'URL du fichier directement pour les images
            const previewUrl = field.thumbnail_url || (isImage ? fileUrl : null);
            
            // Déterminer l'icône en fonction du type de fichier
            let fileIcon, fileType;
            if (isPdf) {
                fileIcon = <FaFilePdf className="h-8 w-8 text-red-500" />;
                fileType = 'pdf';
            } else if (isImage) {
                fileIcon = <FaFileImage className="h-8 w-8 text-green-500" />;
                fileType = 'image';
            } else if (['doc', 'docx', 'odt'].includes(fileExt)) {
                fileIcon = <FaFileWord className="h-8 w-8 text-blue-600" />;
                fileType = 'document';
            } else {
                fileIcon = <FaFileAlt className="h-8 w-8 text-gray-500" />;
                fileType = 'other';
            }
            
            return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center min-w-0">
                            {fileIcon}
                            <div className="ml-3 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {fileExt.toUpperCase()} • {field.file_size ? (field.file_size / 1024).toFixed(1) + ' Ko' : 'Taille inconnue'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                            {isPreviewable && (
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Aperçu"
                                >
                                    <FaEye className="h-4 w-4" />
                                </button>
                            )}
                            <a 
                                href={fileUrl}
                                download={fileName}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Télécharger"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaDownload className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                    
                    {/* Aperçu pour les images miniatures */}
                    {previewUrl && isImage && !showPreview && (
                        <div 
                            className="mt-2 border rounded-md p-2 inline-block cursor-pointer hover:shadow-md transition-shadow bg-white"
                            onClick={() => setShowPreview(true)}
                        >
                            <img 
                                src={previewUrl}
                                alt={`Aperçu de ${fileName}`} 
                                className="max-h-48 max-w-full object-contain"
                            />
                            <p className="mt-1 text-xs text-center text-gray-500">Cliquez pour agrandir</p>
                        </div>
                    )}
                    
                    {/* Aperçu du PDF ou de l'image en mode plein écran */}
                    {showPreview && isPreviewable && (
                        <FilePreview
                            file={{
                                fileName,
                                fileType,
                                downloadUrl: fileUrl
                            }}
                            onClose={() => setShowPreview(false)}
                        />
                    )}
                </div>
            );

        case 'checkbox':
            // Si le champ a des options, c'est une case à cocher multiple
            if (field.options && field.options.length > 0) {
                // S'assurer que field.value est un tableau
                const selectedValues = Array.isArray(field.value) ? field.value : [];
                
                // Si aucune valeur n'est sélectionnée
                if (selectedValues.length === 0) {
                    return <span className="text-gray-400 italic">Aucune sélection</span>;
                }
                
                // Afficher les valeurs sélectionnées
                return (
                    <div className="space-y-2">
                        {field.options.map((option, index) => {
                            const isSelected = selectedValues.includes(option);
                            return (
                                <div key={index} className="flex items-center">
                                    <div className={`h-4 w-4 rounded border mr-2 flex items-center justify-center ${
                                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                    }`}>
                                        {isSelected && (
                                            <FaCheckCircle className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-700">{option}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            } else {
                // Cas d'une case à cocher simple (booléenne)
                const isChecked = field.value === '1' || field.value === 1 || field.value === true || field.value === 'true';
                return (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {isChecked ? (
                            <FaCheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                            <FaTimesCircle className="h-4 w-4 mr-2" />
                        )}
                        {isChecked ? 'Oui' : 'Non'}
                    </div>
                );
            }

        case 'select':
        case 'radio':
            // Si le champ a des options, on affiche le libellé correspondant à la valeur
            if (field.options && Array.isArray(field.options)) {
                const selectedOption = field.options.find(opt => opt.value === field.value);
                return (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {selectedOption ? selectedOption.label : field.value}
                    </span>
                );
            }
            return <span className="px-2 py-1 bg-gray-100 rounded-md">{field.value}</span>;

        case 'textarea':
            return (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="whitespace-pre-line text-gray-900">{field.value}</p>
                </div>
            );

        case 'number':
            return (
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {new Intl.NumberFormat('fr-FR').format(field.value)}
                </span>
            );

        case 'date':
            const date = new Date(field.value);
            return (
                <div className="flex items-center">
                    <FaCalendarAlt className="h-4 w-4 text-gray-500 mr-2" />
                    <span>{date.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
            );

        case 'email':
            return (
                <a 
                    href={`mailto:${field.value}`} 
                    className="inline-flex items-center text-blue-600 hover:underline"
                >
                    <FaEnvelope className="h-4 w-4 mr-2 text-blue-500" />
                    {field.value}
                </a>
            );

        case 'tel':
            return (
                <a 
                    href={`tel:${field.value}`}
                    className="inline-flex items-center text-blue-600 hover:underline"
                >
                    <FaPhone className="h-4 w-4 mr-2 text-green-500" />
                    {field.value}
                </a>
            );

        default:
            return (
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <span className="text-gray-900 break-words">{field.value}</span>
                </div>
            );
    }
}

export default function ApplicationShow({ recruitment, application, customFields = [] }) {
    const [showPreview, setShowPreview] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);

    const { data, setData, put, processing, errors } = useForm({
        status: application.status,
        notes: application.notes || '',
    });

    // Gérer l'ouverture de l'aperçu d'un fichier
    const handlePreviewFile = (file) => {
        // Créer une URL complète pour le fichier
        let fileUrl = file.downloadUrl || file.url || '';
        console.log('Original file URL:', fileUrl);
        
        // Si l'URL est relative, ajouter l'origine
        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:')) {
            // S'assurer qu'il n'y a pas de double slash après l'origine
            const baseUrl = window.location.origin.endsWith('/') 
                ? window.location.origin.slice(0, -1) 
                : window.location.origin;
            
            // Supprimer le slash de début s'il existe
            fileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
            fileUrl = `${baseUrl}/${fileUrl}`;
        }
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const urlWithTimestamp = fileUrl.includes('?') 
            ? `${fileUrl}&t=${timestamp}` 
            : `${fileUrl}?t=${timestamp}`;
        
        console.log('Opening file preview:', {
            originalFile: file,
            processedUrl: urlWithTimestamp,
            headers: file.headers
        });
        
        // Créer un objet URL avec les en-têtes si nécessaire
        const finalUrl = new URL(urlWithTimestamp);
        
        setCurrentFile({
            ...file,
            downloadUrl: finalUrl.toString(),
            fileType: file.fileType || (file.fileName?.endsWith('.pdf') ? 'pdf' : 
                                     ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.fileName?.split('.').pop()?.toLowerCase()) ? 'image' : 'other')
        });
        setShowPreview(true);
    };

    const handleStatusChange = (e) => {
        setData('status', e.target.value);
        
        // Mise à jour immédiate du statut
        put(route('recruitment.applications.status', [recruitment.id, application.id]), {
            preserveScroll: true,
            onSuccess: () => {
                // Mise à jour de l'application avec le nouveau statut
                application.status = e.target.value;
            },
        });
    };

    const handleNotesBlur = () => {
        if (data.notes !== application.notes) {
            put(route('recruitment.applications.status', [recruitment.id, application.id]), {
                preserveScroll: true,
            });
        }
    };

    const getFileIcon = () => {
        if (!application.resume_path) return <FaFilePdf className="h-5 w-5 text-red-500" />;
        const ext = application.resume_path.split('.').pop().toLowerCase();
        return ext === 'pdf' ? 
            <FaFilePdf className="h-5 w-5 text-red-500" /> : 
            <FaFileWord className="h-5 w-5 text-blue-500" />;
    };

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const statusData = statusIcons[application.status] || statusIcons.pending;
    
    return (
        <AdminLayout>
            <Head title={`Candidature - ${application.first_name} ${application.last_name}`} />
            
            {/* Aperçu du fichier modal */}
            {showPreview && currentFile && (
                <FilePreview 
                    file={currentFile}
                    onClose={() => setShowPreview(false)}
                />
            )}
            
            <div className="min-h-screen bg-gray-50">
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 bg-white">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                                    <div>
                                        <div className="flex items-center">
                                            <Link 
                                                href={route('recruitment.applications.index', recruitment.id)}
                                                className="mr-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                            >
                                                <FaArrowLeft className="h-5 w-5" />
                                            </Link>
                                            <div>
                                                <h2 className="text-2xl font-semibold text-gray-800">
                                                    Candidature de {application.first_name} {application.last_name}
                                                </h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Poste : {recruitment.title} • {formatDate(application.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 sm:mt-0">
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusData.color}`}>
                                            {statusData.icon}
                                            <span className="ml-2">{statusData.label}</span>
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Section CV */}
                                <div className="mt-6">
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                                <FaFilePdf className="mr-2 text-red-500" />
                                                Curriculum Vitae
                                            </h3>
                                        </div>
                                        <div className="p-6">
                                            {application.resume_path ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                        <div className="flex items-center min-w-0">
                                                            <FaFilePdf className="h-10 w-10 text-red-500" />
                                                            <div className="ml-4 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate" title={application.resume_name || 'CV.pdf'}>
                                                                    {application.resume_name || 'CV.pdf'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    PDF • {application.resume_size ? formatFileSize(application.resume_size) : 'Taille inconnue'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <a 
                                                                href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                                title="Ouvrir le PDF dans le navigateur"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FaEye className="h-4 w-4" />
                                                            </a>
                                                            <a 
                                                                href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                                download={application.resume_name || 'CV.pdf'}
                                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                                title="Télécharger"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FaDownload className="h-4 w-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                    <FaFileAlt className="mx-auto h-10 w-10 text-gray-300" />
                                                    <p className="mt-2 text-sm text-gray-500">Aucun CV téléchargé</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Grille principale */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Colonne de gauche - Informations du candidat */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Informations du candidat
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                                                <FaUserTie className="h-8 w-8 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {application.first_name} {application.last_name}
                                                </h4>
                                                <div className="mt-1 text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <FaEnvelope className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                                        <a href={`mailto:${application.email}`} className="hover:text-blue-600">
                                                            {application.email}
                                                        </a>
                                                    </div>
                                                    <div className="flex items-center mt-1">
                                                        <FaPhone className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                                        <a href={`tel:${application.phone}`} className="hover:text-blue-600">
                                                            {application.phone}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 border-t border-gray-200 pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <FaCalendarAlt className="mr-1.5 h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-500">
                                                        Postulé le {formatDate(application.created_at)}
                                                    </span>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusData.color}`}>
                                                    {statusData.icon}
                                                    <span className="ml-1.5">{statusData.label}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* CV */}
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            CV du candidat
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        {application.resume_path ? (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                                <div className="flex items-center">
                                                    <div className="p-2 rounded-md bg-gray-50">
                                                        {getFileIcon()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {application.resume_path?.split('/').pop() || 'Aucun fichier'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {application.resume_path ? 
                                                                new Date(application.updated_at).toLocaleDateString('fr-FR') : 
                                                                'Non fourni'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                >
                                                    <FaDownload className="mr-1.5 h-4 w-4" />
                                                    Télécharger
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <FaFileAlt className="mx-auto h-10 w-10 text-gray-300" />
                                                <p className="mt-2 text-sm text-gray-500">Aucun CV téléchargé</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Champs personnalisés */}
                                {customFields.length > 0 && (
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-800">
                                            <h3 className="text-lg font-medium text-white flex items-center">
                                                <FaInfoCircle className="mr-2" />
                                                Informations complémentaires
                                            </h3>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="grid grid-cols-1 gap-6">
                                                {customFields.map((field) => (
                                                    <div 
                                                        key={field.id} 
                                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-200 transition-colors duration-200"
                                                    >
                                                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                            {getFieldTypeIcon(field.field_type)}
                                                            <span className="ml-2">{field.field_label}</span>
                                                        </dt>
                                                        <dd className="mt-2 text-sm text-gray-900 break-words">
                                                            <CustomFieldValue 
                                                                field={field} 
                                                                applicationId={application.id}
                                                                recruitmentId={recruitment.id}
                                                            />
                                                        </dd>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Statut */}
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            État de la candidature
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Statut actuel
                                                </label>
                                                <select
                                                    id="status"
                                                    value={data.status}
                                                    onChange={handleStatusChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="pending">En attente</option>
                                                    <option value="reviewed">Examinée</option>
                                                    <option value="interviewed">En entretien</option>
                                                    <option value="accepted">Acceptée</option>
                                                    <option value="rejected">Rejetée</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes internes
                                                </label>
                                                <textarea
                                                    id="notes"
                                                    rows={4}
                                                    value={data.notes}
                                                    onChange={e => setData('notes', e.target.value)}
                                                    onBlur={handleNotesBlur}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                                                    placeholder="Ajoutez des notes internes sur ce candidat..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Colonne de droite - Lettre de motivation */}
                            <div className="lg:col-span-2">
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Lettre de motivation
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        {application.cover_letter ? (
                                            <div className="prose max-w-none">
                                                {application.cover_letter.split('\n').map((paragraph, i) => (
                                                    <p key={i} className="text-gray-700 mb-4">
                                                        {paragraph || <br />}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">
                                                Aucune lettre de motivation fournie par le candidat.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Actions
                                        </h3>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Êtes-vous sûr de vouloir rejeter cette candidature ?')) {
                                                        handleStatusChange({ target: { value: 'rejected' } });
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <FaTimesCircle className="mr-2 h-4 w-4" />
                                                Rejeter la candidature
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('Êtes-vous sûr de vouloir accepter cette candidature ?')) {
                                                        handleStatusChange({ target: { value: 'accepted' } });
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <FaCheckCircle className="mr-2 h-4 w-4" />
                                                Accepter la candidature
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}