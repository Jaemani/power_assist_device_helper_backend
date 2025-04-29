const crypto = require('crypto');
import bcrypt from 'bcryptjs';

const algorithm = 'aes-256-gcm';
const salt = process.env.HASHIDS_SALT || 'salt-surirusimasuri';
const pepper = process.env.PEPPER || 'pepper-surisurimasuri';
const password = process.env.ENCRYPT_PASSWORD;


// For userId encoding/decoding
export function getKey() {
  return crypto.scryptSync(password, 'keySalt', 32); // 32 bytes = 256 bits
}

export function encryptString(originalString) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // AES-GCM recommends 12 bytes IV
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  const saltedString = salt + originalString + pepper;
  
  let encrypted = cipher.update(saltedString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  const fullCipher = [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted
  ].join('.'); // join into one string
  return fullCipher;
}

export function decryptString(fullCipher) {
  const key = getKey();
  const [ivHex, authTagHex, encryptedData] = fullCipher.split('.');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted.slice(salt.length, decrypted.length - pepper.length);
}

// For password hashing
export async function hashPassword(password){
  const combined = password + pepper;
  return await bcrypt.hash(combined, 12);
}

export async function verifyPassword(password, hashedPassword){
  const combined = password + pepper;
  return await bcrypt.compare(combined, hashedPassword);
}