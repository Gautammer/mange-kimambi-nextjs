'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { decrypt } from '@/lib/crypto';
import { useAuth } from './use-auth';

interface SubscriptionData {
  isSubscribed: boolean;
  endDate: string | null;
  daysRemaining: number | null;
}

export function useSubscription() {
  const { user, isAuthenticated, authToken } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    isSubscribed: false,
    endDate: null,
    daysRemaining: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!isAuthenticated || !authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/v1/subscription-status', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        const decryptedData = decrypt(response.data.data) as SubscriptionData;
        setSubscription(decryptedData);
      } else {
        const message = decrypt(response.data.message) as string;
        setError(message || 'Failed to fetch subscription status');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('An error occurred while fetching subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if subscription is active based on end date
  const isSubscriptionActive = (): boolean => {
    if (!subscription.isSubscribed || !subscription.endDate) {
      return false;
    }

    const endDate = new Date(subscription.endDate);
    return endDate > new Date();
  };

  // Calculate days remaining in subscription
  const getDaysRemaining = (): number => {
    if (!subscription.endDate) return 0;
    
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Refresh subscription data
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated, user?.id]);

  return {
    isSubscribed: subscription.isSubscribed,
    endDate: subscription.endDate,
    daysRemaining: subscription.daysRemaining || getDaysRemaining(),
    isActive: isSubscriptionActive(),
    isLoading,
    error,
    refreshSubscription: fetchSubscriptionStatus,
  };
} 