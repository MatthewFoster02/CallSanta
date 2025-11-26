'use client';

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import PhoneInputComponent, { Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { getCountries } from 'react-phone-number-input/min';

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  error?: string;
  defaultCountry?: Country;
  placeholder?: string;
  onBlur?: () => void;
  className?: string;
}

function detectBrowserCountry(): Country {
  try {
    const locale = typeof navigator !== 'undefined' ? navigator.language || "en-US" : "en-US";
    const region = locale.split("-")[1];
    if (region && region.length === 2) return region as Country;
  } catch {
    /* ignore */
  }
  return "US";
}

export function PhoneInput({
  value,
  onChange,
  label,
  error,
  defaultCountry,
  placeholder = 'Enter phone number',
  onBlur,
  className,
}: PhoneInputProps) {
  const [autoCountry] = useState<Country>(() => detectBrowserCountry());

  const countriesList = useMemo<Country[]>(() => {
    const all = getCountries();
    const prioritized: Country[] = ['US', 'GB'];
    const rest = all.filter((c) => !prioritized.includes(c));
    return [...prioritized, ...rest];
  }, []);

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <PhoneInputComponent
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry ?? autoCountry}
        countries={countriesList}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onBlur={onBlur}
        className={cn(
          "flex w-full rounded-lg border bg-white",
          "px-3 py-2 text-base",
          "focus-within:ring-2 focus-within:ring-primary",
          error ? "border-red-500 focus-within:ring-red-200" : "border-gray-300",
          className
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
