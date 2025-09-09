import { Head, Link, useForm, router } from '@inertiajs/react';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Toaster, toast } from 'react-hot-toast';
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
    FaExclamationTriangle,
    FaStar,
    FaEdit,
    FaSave,
    FaHistory
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
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-100 text-amber-800',
        dot: 'bg-amber-400'
    },
    reviewed: {
        icon: <FaEye className="h-4 w-4" />,
        label: 'Examinée',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-400'
    },
    interviewed: {
        icon: <FaUserTie className="h-4 w-4" />,
        label: 'En entretien',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        badge: 'bg-purple-100 text-purple-800',
        dot: 'bg-purple-400'
    },
    accepted: {
        icon: <FaCheckCircle className="h-4 w-4" />,
        label: 'Acceptée',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        dot: 'bg-emerald-400'
    },
    rejected: {
        icon: <FaTimesCircle className="h-4 w-4" />,
        label: 'Rejetée',
        color: 'bg-red-50 text-red-700 border-red-200',
        badge: 'bg-red-100 text-red-800',
        dot: 'bg-red-400'
    },
};

// Composant pour l'aperçu des fichiers (inchangé)
const FilePreview = ({ file, onClose }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const previewRef = useRef(null);
    
    const getFileUrl = () => {
        if (!file) return '';
        const fileUrl = file.downloadUrl || file.url || '';
        return fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`;
    };
    
    const fileUrl = getFileUrl();

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

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
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

// Composant pour afficher la valeur d'un champ personnalisé (inchangé mais avec styles améliorés)
function CustomFieldValue({ field, applicationId, recruitmentId }) {
    const [showPreview, setShowPreview] = useState(false);
    
    if (!field || field.value === null || field.value === undefined || field.value === '') {
        return <span className="text-gray-400 italic">Non renseigné</span>;
    }

    switch (field.field_type) {
        case 'file':
            if (!field.file_url) {
                return <span className="text-gray-400 italic">Aucun fichier</span>;
            }
            
            const fileName = typeof field.value === 'object' && field.value.file_name 
                ? field.value.file_name 
                : field.value.split('/').pop();
                
            const fileExt = fileName.split('.').pop().toLowerCase();
            const isPdf = fileExt === 'pdf';
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
            const isPreviewable = isPdf || isImage;
            
            const fileUrl = route('recruitment.applications.download.custom', {
                recruitment: recruitmentId,
                application: applicationId,
                fieldName: field.field_name
            });
            
            const previewUrl = field.thumbnail_url || (isImage ? fileUrl : null);
            
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
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                                {fileIcon}
                            </div>
                            <div className="ml-4 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {fileExt.toUpperCase()} • {field.file_size ? (field.file_size / 1024).toFixed(1) + ' Ko' : 'Taille inconnue'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                            {isPreviewable && (
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Aperçu"
                                >
                                    <FaEye className="h-4 w-4" />
                                </button>
                            )}
                            <a 
                                href={fileUrl}
                                download={fileName}
                                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Télécharger"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaDownload className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                    
                    {previewUrl && isImage && !showPreview && (
                        <div 
                            className="mt-3 border rounded-xl p-3 inline-block cursor-pointer hover:shadow-md transition-all duration-200 bg-white"
                            onClick={() => setShowPreview(true)}
                        >
                            <img 
                                src={previewUrl}
                                alt={`Aperçu de ${fileName}`} 
                                className="max-h-48 max-w-full object-contain rounded-lg"
                            />
                            <p className="mt-2 text-xs text-center text-gray-500">Cliquez pour agrandir</p>
                        </div>
                    )}
                    
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
            if (field.options && field.options.length > 0) {
                const selectedValues = Array.isArray(field.value) ? field.value : [];
                
                if (selectedValues.length === 0) {
                    return <span className="text-gray-400 italic">Aucune sélection</span>;
                }
                
                return (
                    <div className="space-y-2">
                        {field.options.map((option, index) => {
                            const isSelected = selectedValues.includes(option);
                            return (
                                <div key={index} className="flex items-center">
                                    <div className={`h-4 w-4 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-300'
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
                const isChecked = field.value === '1' || field.value === 1 || field.value === true || field.value === 'true';
                return (
                    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                        isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
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
            if (field.options && Array.isArray(field.options)) {
                const selectedOption = field.options.find(opt => opt.value === field.value);
                return (
                    <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {selectedOption ? selectedOption.label : field.value}
                    </span>
                );
            }
            return <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm">{field.value}</span>;

        case 'textarea':
            return (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="whitespace-pre-line text-gray-900 text-sm leading-relaxed">{field.value}</p>
                </div>
            );

        case 'number':
            return (
                <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-sm">
                    {new Intl.NumberFormat('fr-FR').format(field.value)}
                </span>
            );

        case 'date':
            const date = new Date(field.value);
            return (
                <div className="flex items-center">
                    <FaCalendarAlt className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">{date.toLocaleDateString('fr-FR', {
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
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline text-sm"
                >
                    <FaEnvelope className="h-4 w-4 mr-2 text-blue-500" />
                    {field.value}
                </a>
            );

        case 'tel':
            return (
                <a 
                    href={`tel:${field.value}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline text-sm"
                >
                    <FaPhone className="h-4 w-4 mr-2 text-green-500" />
                    {field.value}
                </a>
            );

        default:
            return (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-900 break-words text-sm">{field.value}</span>
                </div>
            );
    }
}

export default function ApplicationShow({ recruitment, application, customFields = [] }) {
    const [showPreview, setShowPreview] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        status: application.status,
        notes: application.notes || '',
    });

    const handlePreviewFile = (file) => {
        let fileUrl = file.downloadUrl || file.url || '';
        console.log('Original file URL:', fileUrl);
        
        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('blob:')) {
            const baseUrl = window.location.origin.endsWith('/') 
                ? window.location.origin.slice(0, -1) 
                : window.location.origin;
            
            fileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
            fileUrl = `${baseUrl}/${fileUrl}`;
        }
        
        const timestamp = new Date().getTime();
        const urlWithTimestamp = fileUrl.includes('?') 
            ? `${fileUrl}&t=${timestamp}` 
            : `${fileUrl}?t=${timestamp}`;
        
        console.log('Opening file preview:', {
            originalFile: file,
            processedUrl: urlWithTimestamp,
            headers: file.headers
        });
        
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
        const newStatus = e.target.value;
        setPendingStatus(newStatus);
        setShowStatusModal(true);
    };

    const confirmStatusUpdate = () => {
        if (!pendingStatus) return;
        
        setIsUpdating(true);
        
        // Use Inertia's router for form submission which handles CSRF and proper headers automatically
        router.put(route('recruitment.applications.status', [
            recruitment.id, 
            application.id
        ]), {
            status: pendingStatus,
            notes: data.notes || application.notes || ''
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Update the application data with the fresh data from the server
                const oldStatus = application.status;
                
                // Update the application status in the UI
                application.status = pendingStatus;
                
                // Close the modal and reset states
                setShowStatusModal(false);
                setPendingStatus('');
                setIsUpdating(false);
                
                // Show success message
                toast.success(`Statut mis à jour avec succès de "${statusIcons[oldStatus]?.label || oldStatus}" à "${statusIcons[pendingStatus]?.label || pendingStatus}"`);
            },
            onError: (errors) => {
                console.error('Erreur lors de la mise à jour du statut:', errors);
                
                if (errors.status) {
                    toast.error(errors.status);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Une erreur est survenue lors de la mise à jour du statut');
                }
                
                // Revert to the original status and close the modal
                setData('status', application.status);
                setShowStatusModal(false);
                setPendingStatus('');
                setIsUpdating(false);
            }
        });
    };

    const handleNotesBlur = () => {
        if (data.notes !== application.notes) {
            put(route('recruitment.applications.status', [recruitment.id, application.id]), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditingNotes(false);
                },
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
            
            {showPreview && currentFile && (
                <FilePreview 
                    file={currentFile}
                    onClose={() => setShowPreview(false)}
                />
            )}
            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
                {/* En-tête avec gradient et informations principales */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                            {/* Navigation et titre */}
                            <div className="flex items-center mb-6 lg:mb-0">
                                <Link 
                                    href={route('recruitment.applications.index', recruitment.id)}
                                    className="mr-6 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                >
                                    <FaArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                            <FaUserTie className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                                {application.first_name} {application.last_name}
                                            </h1>
                                            <p className="text-blue-100 text-sm lg:text-base">
                                                Candidat(e) pour le poste de {recruitment.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-blue-100 text-sm">
                                        <FaCalendarAlt className="mr-2 h-4 w-4" />
                                        Candidature reçue le {formatDate(application.created_at)}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Statut et actions rapides */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <div className={`inline-flex items-center px-4 py-2 rounded-xl border-2 backdrop-blur-sm text-sm font-medium ${statusData.color}`}>
                                    <div className={`h-2 w-2 rounded-full mr-2 ${statusData.dot}`}></div>
                                    {statusData.icon}
                                    <span className="ml-2">{statusData.label}</span>
                                </div>
                                
                                {/* Actions rapides */}
                                <div className="flex space-x-2">
                                    {application.resume_path && (
                                        <a
                                            href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                            title="Voir le CV"
                                        >
                                            <FaEye className="h-4 w-4" />
                                        </a>
                                    )}
                                    <a
                                        href={`mailto:${application.email}`}
                                        className="p-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                        title="Envoyer un email"
                                    >
                                        <FaEnvelope className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={`tel:${application.phone}`}
                                        className="p-3 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                        title="Appeler"
                                    >
                                        <FaPhone className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Colonne de gauche - Informations et statut */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Informations de contact */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FaUser className="mr-2 text-blue-600" />
                                        Informations de contact
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                            <FaEnvelope className="h-5 w-5 text-blue-500 mr-3" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                                                <a href={`mailto:${application.email}`} className="text-gray-900 hover:text-blue-600 font-medium">
                                                    {application.email}
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                            <FaPhone className="h-5 w-5 text-green-500 mr-3" />
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Téléphone</p>
                                                <a href={`tel:${application.phone}`} className="text-gray-900 hover:text-blue-600 font-medium">
                                                    {application.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Curriculum Vitae */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FaFilePdf className="mr-2 text-red-500" />
                                        Curriculum Vitae
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {application.resume_path ? (
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50/30 transition-all duration-200">
                                            <div className="flex items-center min-w-0">
                                                <div className="p-3 bg-red-100 rounded-lg">
                                                    <FaFilePdf className="h-6 w-6 text-red-500" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {application.resume_name || 'CV.pdf'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        PDF • {application.resume_size ? formatFileSize(application.resume_size) : 'Taille inconnue'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <a 
                                                    href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    title="Ouvrir"
                                                >
                                                    <FaEye className="h-4 w-4" />
                                                </a>
                                                <a 
                                                    href={route('recruitment.applications.download', [recruitment.id, application.id])}
                                                    download={application.resume_name || 'CV.pdf'}
                                                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                    title="Télécharger"
                                                >
                                                    <FaDownload className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                            <FaFileAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                            <p className="text-gray-500 font-medium">Aucun CV téléchargé</p>
                                            <p className="text-gray-400 text-sm mt-1">Le candidat n'a pas fourni de CV</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gestion du statut */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FaHistory className="mr-2 text-indigo-600" />
                                        Gestion de la candidature
                                    </h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Sélection du statut */}
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-3">
                                            Statut actuel
                                        </label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={handleStatusChange}
                                            className="w-full px-4 py-3 text-base border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all duration-200"
                                            disabled={processing}
                                        >
                                            <option value="pending">⏳ En attente</option>
                                            <option value="reviewed">👁️ Examinée</option>
                                            <option value="interviewed">🤝 En entretien</option>
                                            <option value="accepted">✅ Acceptée</option>
                                            <option value="rejected">❌ Rejetée</option>
                                        </select>
                                    </div>
                                    
                                    {/* Notes internes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                                                Notes internes
                                            </label>
                                            {!isEditingNotes && (
                                                <button
                                                    onClick={() => setIsEditingNotes(true)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center"
                                                >
                                                    <FaEdit className="mr-1 h-3 w-3" />
                                                    Modifier
                                                </button>
                                            )}
                                        </div>
                                        {isEditingNotes ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    id="notes"
                                                    rows={4}
                                                    value={data.notes}
                                                    onChange={e => setData('notes', e.target.value)}
                                                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl resize-none transition-all duration-200"
                                                    placeholder="Ajoutez des notes internes sur ce candidat..."
                                                />
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleNotesBlur}
                                                        disabled={processing}
                                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                                                    >
                                                        <FaSave className="mr-2 h-3 w-3" />
                                                        {processing ? 'Enregistrement...' : 'Enregistrer'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setData('notes', application.notes || '');
                                                            setIsEditingNotes(false);
                                                        }}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[100px]">
                                                {data.notes ? (
                                                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                                                        {data.notes}
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic text-sm">
                                                        Aucune note ajoutée pour ce candidat.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions rapides */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <FaBriefcase className="mr-2 text-green-600" />
                                        Actions rapides
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Êtes-vous sûr de vouloir accepter cette candidature ?')) {
                                                    handleStatusChange({ target: { value: 'accepted' } });
                                                }
                                            }}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-all duration-200 font-medium"
                                        >
                                            <FaCheckCircle className="mr-2 h-4 w-4" />
                                            Accepter la candidature
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Êtes-vous sûr de vouloir rejeter cette candidature ?')) {
                                                    handleStatusChange({ target: { value: 'rejected' } });
                                                }
                                            }}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 font-medium"
                                        >
                                            <FaTimesCircle className="mr-2 h-4 w-4" />
                                            Rejeter la candidature
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleStatusChange({ target: { value: 'interviewed' } });
                                            }}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all duration-200 font-medium"
                                        >
                                            <FaUserTie className="mr-2 h-4 w-4" />
                                            Programmer un entretien
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Colonne de droite - Contenu principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Lettre de motivation */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                        <FaFileContract className="mr-3 text-blue-600" />
                                        Motivation
                                    </h3>
                                </div>
                                <div className="p-6">
                                    {application.cover_letter ? (
                                        <div className="prose max-w-none">
                                            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-100">
                                                {application.cover_letter.split('\n').map((paragraph, i) => (
                                                    <p key={i} className="text-gray-700 mb-4 leading-relaxed last:mb-0">
                                                        {paragraph || <br />}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                            <FaFileAlt className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                            <p className="text-gray-500 font-medium text-lg mb-2">
                                                Aucune lettre de motivation
                                            </p>
                                            <p className="text-gray-400">
                                                Le candidat n'a pas fourni de lettre de motivation.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Champs personnalisés */}
                            {customFields.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                            <FaInfoCircle className="mr-3 text-purple-600" />
                                            Informations complémentaires
                                            <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                {customFields.length} champ{customFields.length > 1 ? 's' : ''}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {customFields.map((field) => (
                                                <div 
                                                    key={field.id} 
                                                    className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-5 border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-200"
                                                >
                                                    <dt className="text-sm font-semibold text-gray-700 flex items-center mb-3">
                                                        <div className="p-1.5 bg-white rounded-lg mr-3 shadow-sm">
                                                            {getFieldTypeIcon(field.field_type)}
                                                        </div>
                                                        <span>{field.field_label}</span>
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 break-words">
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Composant Toaster pour les notifications */}
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: '#fff',
                        color: '#1f2937',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        borderRadius: '0.375rem',
                        padding: '1rem',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            
            {/* Modal de confirmation */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                                    Confirmer le changement de statut
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Êtes-vous sûr de vouloir changer le statut de <span className="font-semibold">{application.first_name} {application.last_name}</span> de <span className="font-semibold">{statusIcons[application.status]?.label || application.status}</span> à <span className="font-semibold">{statusIcons[pendingStatus]?.label || pendingStatus}</span> ?
                                    </p>
                                    {pendingStatus === 'rejected' && (
                                        <p className="text-sm text-red-500 mt-2">
                                            <FaExclamationTriangle className="inline mr-1" /> Cette action enverra une notification au candidat.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-5 flex justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={isUpdating}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmStatusUpdate}
                                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUpdating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            En cours...
                                        </span>
                                    ) : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}