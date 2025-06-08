import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

interface TokenPayload {
  userId?: string;
  id?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          message: encrypt('Unauthorized')
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as TokenPayload | null;
    
    if (!decoded) {
      return NextResponse.json(
        { 
          success: false, 
          message: encrypt('Invalid token')
        },
        { status: 401 }
      );
    }

    // Get user ID from token
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          message: encrypt('Invalid token payload')
        },
        { status: 401 }
      );
    }

    // Get user subscription data
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        isSubscribed: true,
        endOfSubscriptionDate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: encrypt('User not found')
        },
        { status: 404 }
      );
    }

    // Calculate days remaining in subscription
    let daysRemaining = null;
    if (user.endOfSubscriptionDate) {
      const endDate = new Date(user.endOfSubscriptionDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Return subscription data
    const subscriptionData = {
      isSubscribed: user.isSubscribed === 'true',
      endDate: user.endOfSubscriptionDate ? user.endOfSubscriptionDate.toISOString() : null,
      daysRemaining,
    };

    return NextResponse.json({
      success: true,
      data: encrypt(subscriptionData),
    });
    
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: encrypt('An error occurred while fetching subscription status')
      },
      { status: 500 }
    );
  }
} 