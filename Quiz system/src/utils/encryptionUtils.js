import CryptoJS from 'crypto-js';

// Fallback key for frontend if env var is missing. 
// In production, sensitive data should ideally be decrypted server-side or via robust key management.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'proja-survey-solutions-secret-key-2026';

export const encrypt = (text) => {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption fails (e.g., wrong key), originalText might be empty
    return originalText || cipherText; 
  } catch (error) {
    console.error('Decryption failed:', error);
    return cipherText;
  }
};