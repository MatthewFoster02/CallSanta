'use client';

import { cn } from '@/lib/utils';
import { FaInstagram, FaTiktok, FaFacebook, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';

type AsSeenBarProps = {
  className?: string;
};

const PLATFORMS: { name: string; icon: IconType; link?: string }[] = [
  { name: 'Instagram', icon: FaInstagram, link: 'https://instagram.com/santasnumberonig' },
  { name: 'TikTok', icon: FaTiktok, link: 'https://www.tiktok.com/@santasnumber?_r=1&_t=ZN-91oX7xmJOA2' },
  { name: 'Facebook', icon: FaFacebook, link: 'https://www.facebook.com/share/16nhKvceHA/?mibextid=wwXIfr' },
  { name: 'YouTube', icon: FaYoutube, link: 'https://www.youtube.com/channel/UCWE3IJm1j25fhAIdSYnOxrA' },
];

export function AsSeenBar({ className }: AsSeenBarProps) {
  return (
    <div className={cn('bg-white relative z-40', className)}>
      {/* Gold top accent line */}
      <div className="h-0.5 bg-[#d4a849]" />

      <div className="py-3 px-3">
        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-[#d4a849]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c41e3a]">
            As seen on
          </p>
          <div className="h-px w-8 bg-[#d4a849]" />
        </div>

        {/* Platform logos */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {PLATFORMS.map((platform) => (
            <div key={platform.name} className="transition-transform duration-300">
              {platform.link ? (
                <a href={platform.link} target="_blank" rel="noopener noreferrer">
                  <platform.icon
                    size={24}
                    className="text-[#c41e3a] opacity-80 hover:opacity-100 transition-opacity"
                  />
                </a>
              ) : (
                <platform.icon
                  size={24}
                  className="text-[#c41e3a] opacity-80 hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
