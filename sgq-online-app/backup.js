const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { del, get, put } = require("@vercel/blob");

const backupDir =
  process.env.SGQ_BACKUP_DIR ||
  (process.env.VERCEL ? path.join(os.tmpdir(), "sgq-backups") : path.join(__dirname, "data", "backups"));

function encryptionKey() {
  const source = process.env.BACKUP_ENCRYPTION_KEY || process.env.SESSION_SECRET || "";
  if (!source) throw new Error("backup_encryption_key_missing");
  return crypto.createHash("sha256").update(source).digest();
}

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function backupStorageMode() {
  if (blobConfigured()) return "vercel-blob";
  return process.env.VERCEL ? "unavailable" : "local";
}

function encodeSnapshot(snapshot) {
  const plaintext = Buffer.from(JSON.stringify(snapshot), "utf8");
  const checksum = crypto.createHash("sha256").update(plaintext).digest("hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(zlib.gzipSync(plaintext)), cipher.final()]);
  const envelope = Buffer.from(
    JSON.stringify({
      version: 1,
      algorithm: "aes-256-gcm+gzip",
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      checksum,
      payload: encrypted.toString("base64"),
    }),
    "utf8",
  );
  return { envelope, checksum, plaintextBytes: plaintext.length };
}

function decodeSnapshot(envelopeBuffer, expectedChecksum = "") {
  const envelope = JSON.parse(envelopeBuffer.toString("utf8"));
  if (envelope.version !== 1 || envelope.algorithm !== "aes-256-gcm+gzip") {
    throw new Error("backup_format_invalid");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(envelope.payload, "base64")),
    decipher.final(),
  ]);
  const plaintext = zlib.gunzipSync(compressed);
  const checksum = crypto.createHash("sha256").update(plaintext).digest("hex");
  if (checksum !== envelope.checksum || (expectedChecksum && checksum !== expectedChecksum)) {
    throw new Error("backup_checksum_invalid");
  }
  return { snapshot: JSON.parse(plaintext.toString("utf8")), checksum };
}

function validateSnapshot(snapshot) {
  if (
    snapshot?.version !== 2 ||
    snapshot?.scope !== "recovery" ||
    !Array.isArray(snapshot.companies) ||
    !Array.isArray(snapshot.users) ||
    !Array.isArray(snapshot.companyData)
  ) {
    throw new Error("backup_snapshot_invalid");
  }
  const companyIds = new Set(snapshot.companies.map((company) => Number(company.id)));
  if (snapshot.users.some((user) => !companyIds.has(Number(user.company_id)))) {
    throw new Error("backup_user_company_invalid");
  }
  if (snapshot.companyData.some((row) => !companyIds.has(Number(row.company_id)))) {
    throw new Error("backup_data_company_invalid");
  }
  return {
    companies: snapshot.companies.length,
    users: snapshot.users.length,
    records: snapshot.companyData.length,
  };
}

async function writeBackupArtifact(snapshot) {
  const mode = backupStorageMode();
  if (mode === "unavailable") throw new Error("backup_storage_not_configured");
  const { envelope, checksum, plaintextBytes } = encodeSnapshot(snapshot);
  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sgqb`;
  const storageKey = `sgq-backups/${fileName}`;
  if (mode === "vercel-blob") {
    const result = await put(storageKey, envelope, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/octet-stream",
    });
    return {
      storageKey: result.pathname || storageKey,
      storageUrl: result.url,
      checksum,
      byteSize: envelope.length,
      metadata: { mode, plaintextBytes },
    };
  }
  fs.mkdirSync(backupDir, { recursive: true });
  const localPath = path.join(backupDir, fileName);
  fs.writeFileSync(localPath, envelope);
  return {
    storageKey: localPath,
    storageUrl: "",
    checksum,
    byteSize: envelope.length,
    metadata: { mode, plaintextBytes },
  };
}

async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function readBackupArtifact(record) {
  if (record.metadata?.mode === "vercel-blob" || record.storageUrl) {
    const result = await get(record.storageUrl || record.storageKey, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) throw new Error("backup_artifact_not_found");
    return streamToBuffer(result.stream);
  }
  return fs.promises.readFile(record.storageKey);
}

async function verifyBackupArtifact(record) {
  const envelope = await readBackupArtifact(record);
  const decoded = decodeSnapshot(envelope, record.checksum);
  return { ok: true, checksum: decoded.checksum, counts: validateSnapshot(decoded.snapshot) };
}

async function deleteBackupArtifact(record) {
  if (record.metadata?.mode === "vercel-blob" || record.storageUrl) {
    await del(record.storageUrl || record.storageKey);
    return;
  }
  await fs.promises.rm(record.storageKey, { force: true });
}

function retentionCutoff() {
  const days = Math.max(7, Math.min(Number(process.env.BACKUP_RETENTION_DAYS) || 30, 365));
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

module.exports = {
  backupStorageMode,
  deleteBackupArtifact,
  retentionCutoff,
  validateSnapshot,
  verifyBackupArtifact,
  writeBackupArtifact,
};
