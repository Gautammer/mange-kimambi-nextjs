import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'x1e8a1c1cf412b27ecd7a87db49f830g';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'g9f051fdf0e6388x';

export const encrypt = (data: unknown): string => {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(
    dataString,
    CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
    {
      iv: CryptoJS.enc.Utf8.parse(ENCRYPTION_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );
  return encrypted.toString();
};

export const decrypt = (encryptedData: string): unknown => {
  try {
    if (!encryptedData) return null;
    
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      {
        iv: CryptoJS.enc.Utf8.parse(ENCRYPTION_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString || decryptedString === '0') {
      return null;
    }
    
    // Try to parse as JSON, if fails return as string
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// API response helpers
export const encryptResponse = (data: unknown) => {
  return {
    success: true,
    data: encrypt(data)
  };
};

export const encryptError = (message: string) => {
  return {
    success: false,
    message: encrypt(message)
  };
}; 