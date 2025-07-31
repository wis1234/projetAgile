import React from 'react';
import { 
  FaFileAlt, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileCode, 
  FaFileArchive,
  FaFileAudio,
  FaFileVideo,
  FaFileDownload
} from 'react-icons/fa';

const FileIcon = ({ type, className = '', size = 'text-xl' }) => {
  const iconClass = `${size} ${className}`;
  
  if (!type) return <FaFileAlt className={`${iconClass} text-gray-400`} />;
  
  const typeLower = type.toLowerCase();
  
  // Images
  if (typeLower.startsWith('image/')) {
    return <FaFileImage className={`${iconClass} text-blue-500`} />;
  }
  
  // PDFs
  if (typeLower.includes('pdf')) {
    return <FaFilePdf className={`${iconClass} text-red-500`} />;
  }
  
  // Word Documents
  if (typeLower.includes('word') || typeLower.includes('document') || 
      typeLower.endsWith('doc') || typeLower.endsWith('docx')) {
    return <FaFileWord className={`${iconClass} text-blue-600`} />;
  }
  
  // Excel
  if (typeLower.includes('excel') || typeLower.includes('spreadsheet') || 
      typeLower.endsWith('xls') || typeLower.endsWith('xlsx')) {
    return <FaFileExcel className={`${iconClass} text-green-600`} />;
  }
  
  // Code files
  if (typeLower.includes('text/') || 
      typeLower.includes('javascript') || 
      typeLower.includes('json') || 
      typeLower.includes('xml') ||
      typeLower.endsWith('js') || 
      typeLower.endsWith('jsx') ||
      typeLower.endsWith('ts') ||
      typeLower.endsWith('tsx') ||
      typeLower.endsWith('html') ||
      typeLower.endsWith('css') ||
      typeLower.endsWith('php')) {
    return <FaFileCode className={`${iconClass} text-purple-500`} />;
  }
  
  // Audio
  if (typeLower.startsWith('audio/')) {
    return <FaFileAudio className={`${iconClass} text-yellow-500`} />;
  }
  
  // Video
  if (typeLower.startsWith('video/')) {
    return <FaFileVideo className={`${iconClass} text-red-400`} />;
  }
  
  // Archives
  if (typeLower.includes('zip') || 
      typeLower.includes('rar') || 
      typeLower.includes('7z') ||
      typeLower.includes('tar') ||
      typeLower.includes('gz')) {
    return <FaFileArchive className={`${iconClass} text-gray-500`} />;
  }
  
  // Generic file
  return <FaFileAlt className={`${iconClass} text-gray-400`} />;
};

export default FileIcon;
