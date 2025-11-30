/**
 * Meta Pixel helper function
 * Safely fires pixel events, handling SSR and missing pixel gracefully
 */
export function fbq(
  action: 'track' | 'trackCustom' | 'init',
  eventNameOrPixelId: string,
  parameters?: Record<string, unknown>,
  options?: { eventID?: string }
): void {
  if (typeof window !== 'undefined' && window.fbq) {
    if (parameters && options) {
      window.fbq(action, eventNameOrPixelId, parameters, options);
    } else if (parameters) {
      window.fbq(action, eventNameOrPixelId, parameters);
    } else {
      window.fbq(action, eventNameOrPixelId);
    }
  }
}

/**
 * Track a standard Meta Pixel event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>
): void {
  fbq('track', eventName, parameters);
}

/**
 * Track a custom Meta Pixel event
 */
export function trackCustomEvent(
  eventName: string,
  parameters?: Record<string, unknown>
): void {
  fbq('trackCustom', eventName, parameters);
}
