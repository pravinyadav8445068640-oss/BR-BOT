import crypto from 'crypto';
import { loadDatabase, saveDatabase, User, Session, AuditLog } from './db.ts';

// Master key for server-side credential encryption (derived from environment or server secret)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'brbot_enterprise_options_trading_platform_secure_master_key_2026';
const KEY = crypto.scryptSync(ENCRYPTION_SECRET, 'brbot_salt', 32);

export function encryptSecret(plainText: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decryptSecret(encrypted: string, ivHex: string, authTagHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '***DECRYPTION_ERROR***';
  }
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(userId: string, ip: string, userAgent: string): Session {
  const db = loadDatabase();
  const token = generateToken();
  const session: Session = {
    token,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    ip,
    userAgent,
  };
  db.sessions.push(session);
  saveDatabase(db);
  return session;
}

export function getSessionUser(token: string): User | null {
  if (!token) return null;
  const db = loadDatabase();
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date()
  );
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user || null;
}

export function logAuditEvent(
  action: string,
  details: string,
  userId?: string,
  userEmail?: string,
  ip = '127.0.0.1'
): void {
  const db = loadDatabase();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail,
    action,
    details,
    ip,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  saveDatabase(db);
}

// In-memory sliding window rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}
