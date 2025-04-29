import Hashids from 'hashids';
import bcrypt from 'bcrypt';

const salt = process.env.HASHIDS_SALT || 'salt-surirusimasuri';
const pepper = process.env.PEPPER || 'pepper-surisurimasuri';


// For userId encoding/decoding
const hashids = new Hashids(salt, 10);

export function encodeId(id) {
  return hashids.encode(Number(id));  // Always encode numbers
}

export function decodeId(encoded){
  const decoded = hashids.decode(encoded);
  if (decoded.length === 0) return null;
  return decoded[0]; // decoded is an array
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