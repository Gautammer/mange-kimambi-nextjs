import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './auth';
import { encryptError } from './crypto';

interface DecodedToken {
  userId: string;
  iat?: number;
  exp?: number;
}

export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as DecodedToken | null;
  
  if (!decoded) {
    throw new Error('Invalid token');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: BigInt(decoded.userId) }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check subscription status
  if (user.endOfSubscriptionDate && new Date(user.endOfSubscriptionDate) < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isSubscribed: 'false',
        endOfSubscriptionDate: null
      }
    });
    user.isSubscribed = 'false';
  }
  
  return user;
}

export function createSuccessResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(message: string, status = 400) {
  return NextResponse.json(encryptError(message), { status });
}

export async function checkSubscription(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      isSubscribed: true, 
      endOfSubscriptionDate: true 
    }
  });
  
  const sysConfig = await prisma.sysConfig.findFirst();
  
  // If app is free, everyone is subscribed
  if (sysConfig?.appType === 'Free') {
    return true;
  }
  
  // Check if subscription is active
  if (user?.isSubscribed === 'true' && user.endOfSubscriptionDate) {
    return new Date(user.endOfSubscriptionDate) > new Date();
  }
  
  return false;
} 