import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface SubscriptionCalculation {
  subscriptionStart: Date;
  subscriptionEnd: Date;
  daysAdded: number;
}

export async function calculateSubscription(
  userId: bigint,
  amount: number,
  currency: string
): Promise<SubscriptionCalculation> {
  // Get user's current subscription
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { endOfSubscriptionDate: true }
  });
  
  // Determine subscription start date
  const now = new Date();
  const subscriptionStart = user?.endOfSubscriptionDate && 
    new Date(user.endOfSubscriptionDate) > now
    ? new Date(user.endOfSubscriptionDate)
    : now;
  
  // Calculate days based on amount and currency
  let daysToAdd = 0;
  
  // Currency conversion rates (example)
  const rates: Record<string, number> = {
    'USD': 1,
    'TSH': 0.00043, // Tanzania Shilling to USD
    'KES': 0.0068,  // Kenya Shilling to USD
  };
  
  const amountInUSD = amount * (rates[currency] || 1);
  
  // Subscription tiers (example)
  if (amountInUSD >= 30) {
    daysToAdd = 365; // 1 year
  } else if (amountInUSD >= 10) {
    daysToAdd = 90;  // 3 months
  } else if (amountInUSD >= 5) {
    daysToAdd = 30;  // 1 month
  } else if (amountInUSD >= 2) {
    daysToAdd = 7;   // 1 week
  } else if (amountInUSD >= 0.5) {
    daysToAdd = 1;   // 1 day
  }
  
  // Calculate end date
  const subscriptionEnd = new Date(subscriptionStart);
  subscriptionEnd.setDate(subscriptionEnd.getDate() + daysToAdd);
  
  return {
    subscriptionStart,
    subscriptionEnd,
    daysAdded: daysToAdd
  };
}

export async function createPayment(
  userId: bigint,
  paymentData: {
    orderId?: string;
    transid?: string;
    reference?: string;
    channel: string;
    amount: number;
    currency: string;
    phone?: string;
  }
) {
  const subscription = await calculateSubscription(
    userId,
    paymentData.amount,
    paymentData.currency
  );
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      orderId: paymentData.orderId,
      transid: paymentData.transid,
      reference: paymentData.reference,
      channel: paymentData.channel,
      amount: new Decimal(paymentData.amount),
      currency: paymentData.currency,
      phone: paymentData.phone,
      paymentStatus: 'COMPLETED',
      result: 'SUCCESS',
      startDate: subscription.subscriptionStart,
      endDate: subscription.subscriptionEnd,
    }
  });
  
  // Update user subscription
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: 'true',
      endOfSubscriptionDate: subscription.subscriptionEnd
    }
  });
  
  return payment;
} 