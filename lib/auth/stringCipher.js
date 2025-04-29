import bcrypt from 'bcryptjs';

const salt = process.env.HASHIDS_SALT || 'salt-surirusimasuri';
const pepper = process.env.PEPPER || 'pepper-surisurimasuri';


// For userId encoding/decoding
export function encryptString(string) {
  const combined = salt + string + pepper;
  return btoa(combined);
}

export function decryptString(encodedText) {
  const combined = atob(encodedText);
  if (!combined.startsWith(salt) || !combined.endsWith(pepper)) {
    throw new Error('Invalid salt/pepper!');
  }
  return combined.slice(salt.length, combined.length - pepper.length);
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