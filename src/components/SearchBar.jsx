'use client';

import { useState, useEffect } from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search accessories (e.g. 65W charger, iPhone 15 cover, Anker...)' }) {
  const [internalValue, setInternalValue] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);

  // Keep internal state in sync with external value
  if (value !== prevValue) {
    setPrevValue(value);
    setInternalValue(value || '');
  }

  // Debounced search change handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [internalValue, value, onChange]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400">
          <svg
            className="w-5 h-5 sm:w-5 sm:h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field matching reference image */}
        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 sm:pl-12 pr-12 py-3.5 sm:py-4 bg-[#141b2a] hover:bg-[#161f30] focus:bg-[#182337] border border-slate-800 focus:border-blue-500/70 rounded-2xl text-sm sm:text-base text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-lg shadow-black/20 transition-all duration-200"
        />

        {/* Clear Button */}
        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Clear search"
          >
            <div className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs">
              ✕
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
