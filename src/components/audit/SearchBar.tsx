'use client';

import { ChangeEvent } from 'react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'search...',
}: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="font-mono">
      <div className="flex items-center border border-[#1e293b] bg-[#fefcf3]">
        <span className="px-3 py-2 text-[#1e293b] opacity-60">{'\u2192'}</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-2 text-sm text-[#0f172a] placeholder-[#1e293b] placeholder-opacity-40 outline-none"
          style={{ borderRadius: 0 }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 text-[#1e293b] opacity-60 hover:opacity-100"
            aria-label="Clear search"
          >
            {'\u00f8'}
          </button>
        )}
      </div>
    </div>
  );
}
