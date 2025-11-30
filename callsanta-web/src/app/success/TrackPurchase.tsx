'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/meta/fbq';

interface TrackPurchaseProps {
  callId: string;
  amount: number;
  currency: string;
}

/**
 * Client component to track Purchase event on success page load.
 * Uses sessionStorage to prevent duplicate tracking on page refresh.
 */
export function TrackPurchase({ callId, amount, currency }: TrackPurchaseProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate tracking
    if (hasTrackedRef.current) return;

    const storageKey = `meta_purchase_tracked_${callId}`;

    // Check if already tracked in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
      return;
    }

    hasTrackedRef.current = true;

    // Track Purchase event as backup
    trackEvent('Purchase', {
      content_name: 'Santa Call',
      value: amount / 100,
      currency: currency.toUpperCase(),
      content_ids: [callId],
    });

    // Mark as tracked in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [callId, amount, currency]);

  return null;
}
