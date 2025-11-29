'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui';
import type { StoredAffiliate } from '@/lib/affiliate/storage';

interface AffiliateLinksProps {
  affiliate: StoredAffiliate;
  showHeader?: boolean;
  showBookButton?: boolean;
  showTips?: boolean;
}

export function AffiliateLinksPanel({
  affiliate,
  showHeader = true,
  showBookButton = false,
  showTips = false,
}: AffiliateLinksProps) {
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = async (text: string, type: 'direct' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'direct') {
        setCopiedDirect(true);
        setTimeout(() => setCopiedDirect(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="text-center">
          <h3 className="text-lg font-bold text-[#c41e3a]">
            Your Affiliate Links
          </h3>
          <p className="text-sm text-gray-600">
            Share these links to earn 20% on every booking!
          </p>
        </div>
      )}

      {/* Friendly URL */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Your Link (for social bios)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate">
            {affiliate.links.direct}
          </div>
          <button
            onClick={() => copyToClipboard(affiliate.links.direct, 'direct')}
            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Copy to clipboard"
          >
            {copiedDirect ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tracking URL */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Tracking Link (for ads)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate">
            {affiliate.links.withCode}
          </div>
          <button
            onClick={() => copyToClipboard(affiliate.links.withCode, 'code')}
            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Copy to clipboard"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      {showTips && (
        <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Quick Tips</p>
          <div className="text-xs text-gray-600 space-y-1.5">
            <p>🎬 <strong>Try it yourself</strong> — record a reaction video for authentic marketing</p>
            <p>📱 <strong>Auto-videos included</strong> — we create shareable clips after each call</p>
          </div>
        </div>
      )}

      {showBookButton && (
        <div className="pt-2">
          <a href="/book" className="block">
            <Button variant="primary" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Book a Call
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
