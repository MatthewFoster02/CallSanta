export {};

declare global {
  interface Window {
    fbq: (
      action: 'track' | 'trackCustom' | 'init',
      eventNameOrPixelId: string,
      parameters?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}
