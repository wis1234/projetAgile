/**
 * Vérifie si un fichier est éditable en fonction de son type MIME ou de son extension
 * @param {string} fileType - Le type MIME du fichier
 * @param {string} fileName - Le nom du fichier avec extension
 * @returns {boolean} - True si le fichier est éditable
 */
export const isFileEditable = (fileType, fileName) => {
  if (!fileType && !fileName) return false;
  
  // Liste des types MIME éditables
  const editableMimeTypes = [
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
  ];

  // Liste des extensions éditables (au cas où le type MIME n'est pas fiable)
  const editableExtensions = [
    'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'ini', 'cfg', 'conf',
    'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less', 'styl',
    'js', 'jsx', 'ts', 'tsx', 'coffee', 'mjs', 'cjs',
    'php', 'py', 'rb', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'swift', 'kt', 'scala',
    'sql', 'ps1', 'bat', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'cmd',
    'vue', 'svelte', 'handlebars', 'hbs', 'pug', 'jade', 'ejs', 'twig'
  ];

  // Vérifier le type MIME
  const mimeType = (fileType || '').toLowerCase();
  if (editableMimeTypes.some(type => mimeType.includes(type))) {
    return true;
  }

  // Vérifier l'extension du fichier
  const extension = fileName.split('.').pop().toLowerCase();
  return editableExtensions.includes(extension);
};

/**
 * Vérifie si un fichier est un PDF
 * @param {string} fileType - Le type MIME du fichier
 * @param {string} fileName - Le nom du fichier avec extension
 * @returns {boolean} - True si le fichier est un PDF
 */
export const isPdfFile = (fileType, fileName) => {
  if (fileType === 'application/pdf') return true;
  const extension = (fileName || '').split('.').pop().toLowerCase();
  return extension === 'pdf';
};
