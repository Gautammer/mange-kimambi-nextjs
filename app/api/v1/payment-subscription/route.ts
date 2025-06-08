import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();

    // Decrypt and validate fields
    const userid = body.userid;
    const type = body.type;
    const subscriptionDate = body.subscription_date;
    const subscriptionEndDate = body.subscription_end_date;
    const currency = body.currency;
    const transactionId = body.transcation_id;
    const amount = parseFloat(body.amount);

    if (!userid || !type || !subscriptionDate || !subscriptionEndDate || 
        !currency || !transactionId || !amount) {
      return createErrorResponse('All fields are required');
    }

    // Verify user ID matches authenticated user
    if (BigInt(userid) !== user.id) {
      return createErrorResponse('Unauthorized', 403);
    }

    // Create or update payment
    await prisma.payment.upsert({
      where: { reference: transactionId },
      update: {
        amount: amount,
        paymentStatus: 'COMPLETED',
        result: 'COMPLETED'
      },
      create: {
        userId: user.id,
        orderId: transactionId,
        reference: transactionId,
        channel: type,
        amount: amount,
        currency: currency,
        phone: user.phone,
        result: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        startDate: new Date(subscriptionDate),
        endDate: new Date(subscriptionEndDate)
      }
    });

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isSubscribed: 'true',
        endOfSubscriptionDate: new Date(subscriptionEndDate)
      }
    });

    return createSuccessResponse({
      status: true,
      message: 'success'
    });

  } catch (error) {
    console.error('Payment subscription error:', error);
    return createErrorResponse('Payment processing failed', 500);
  }
} 