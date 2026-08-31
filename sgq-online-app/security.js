const crypto = require("crypto");
const {
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret,
  generateURI,
  verifySync,
} = require("otplib");

const otpCrypto = new NobleCryptoPlugin();
const otpBase32 = new ScureBase32Plugin();

function encryptionKey(secret) {
  return crypto.createHash("sha256").update(String(secret || "")).digest();
}

function encryptValue(value, secret) {
  if (!value) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptValue(value, secret) {
  if (!value) return "";
  const [version, ivValue, tagValue, encryptedValue] = String(value).split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) return "";
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(secret),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

function createMfaSetup(username) {
  const secret = generateSecret({ crypto: otpCrypto, base32: otpBase32, length: 20 });
  const uri = generateURI({
    type: "totp",
    secret,
    issuer: "QualityPro Cloud",
    label: String(username || "administrador"),
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
  return { secret, uri };
}

function verifyTotp(secret, token) {
  if (!secret || !/^\d{6}$/.test(String(token || "").trim())) return false;
  try {
    return verifySync({
      secret,
      token: String(token).trim(),
      crypto: otpCrypto,
      base32: otpBase32,
      epochTolerance: 30,
    }).valid;
  } catch {
    return false;
  }
}

function normalizeRecoveryCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function hashRecoveryCode(code) {
  return crypto.createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

function generateRecoveryCodes(count = 8) {
  const values = Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(6).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  });
  return {
    values,
    hashes: values.map(hashRecoveryCode),
  };
}

module.exports = {
  createMfaSetup,
  decryptValue,
  encryptValue,
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyTotp,
};
