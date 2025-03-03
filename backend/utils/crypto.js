const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// Use a chave JWT como chave de criptografia para simplificar
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * Criptografa uma string
 * @param {string} text - Texto para criptografar
 * @returns {string} - Texto criptografado
 */
const encrypt = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

/**
 * Descriptografa uma string
 * @param {string} ciphertext - Texto criptografado
 * @returns {string} - Texto descriptografado
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Gera um hash SHA-256 para uma string
 * @param {string} text - Texto para hash
 * @returns {string} - Hash hexadecimal
 */
const generateHash = (text) => {
  if (!text) return null;
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Gera uma string aleatória
 * @param {number} length - Comprimento da string
 * @returns {string} - String aleatória
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  generateHash,
  generateRandomString
};