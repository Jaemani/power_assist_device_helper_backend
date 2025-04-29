const crypto = require('crypto');
import bcrypt from 'bcryptjs';

const algorithm = 'aes-256-gcm';
const salt = process.env.HASHIDS_SALT || 'salt-surirusimasuri';
const pepper = process.env.PEPPER || 'pepper-surisurimasuri';
const password = process.env.ENCRYPT_PASSWORD;



function getKey() {
  return crypto.scryptSync(password, 'keySalt', 32);
}

// Helpers
function toBase64Url(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64;
}

// Encrypt full salted string
export function encryptString(originalString) {
  const key = getKey();
  const iv = crypto.randomBytes(12);

  const saltedString = salt + originalString + pepper;
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(saltedString, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, encryptedBuffer]);
  return toBase64Url(payload.toString('base64'));
}

// Decrypt full salted string
export function decryptString(base64urlString) {
  const payload = Buffer.from(fromBase64Url(base64urlString), 'base64');

  const iv = payload.slice(0, 12);            // first 12 bytes
  const authTag = payload.slice(12, 28);       // next 16 bytes
  const encryptedData = payload.slice(28);     // remaining bytes

  const key = getKey();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  const decryptedBuffer = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);

  const fullString = decryptedBuffer.toString('utf8');

  if (!fullString.startsWith(salt) || !fullString.endsWith(pepper)) {
    throw new Error('Invalid decrypted content');
  }

  return fullString.slice(salt.length, -pepper.length); // Extract only originalString
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