import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET!, {
    expiresIn: '30d'
  });
}

export function verifyToken(token: string): unknown {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
  } catch {
    return null;
  }
}

export async function validateClientKey(key: string) {
  const client = await prisma.oauthClient.findUnique({
    where: { secret: key }
  });
  return client;
}

export async function createAccessToken(userId: bigint, clientId: bigint) {
  const token = generateToken({ userId: userId.toString() });
  
  await prisma.oauthAccessToken.create({
    data: {
      id: token,
      userId,
      clientId,
      name: 'appToken',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return token;
} 