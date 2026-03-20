import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

export interface JwtUserPayload {
  userId: string;
  role: 'customer' | 'admin';
  email: string;
}

export interface UserRow {
  id: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
}

const JWT_SECRET = process.env.JWT_SECRET || 'poc-dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await query<UserRow>('SELECT id, email, password, role FROM users WHERE LOWER(email) = $1', [
    normalized,
  ]);
  return rows[0] ?? null;
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<{ user: UserRow } | { error: string }> {
  const user = await findUserByEmail(email);
  if (!user) {
    return { error: 'Invalid email or password' };
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return { error: 'Invalid email or password' };
  }
  return { user };
}

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & Partial<JwtUserPayload>;
    if (!decoded.userId || !decoded.role || !decoded.email) return null;
    if (decoded.role !== 'customer' && decoded.role !== 'admin') return null;
    return {
      userId: String(decoded.userId),
      role: decoded.role,
      email: String(decoded.email).toLowerCase(),
    };
  } catch {
    return null;
  }
}
