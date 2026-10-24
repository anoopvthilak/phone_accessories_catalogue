'use client';

import { useEffect } from 'react';

// Category icon helper for visual delight
const CATEGORY_ICONS = {
  'Chargers': '⚡',
  'USB Cables': '🔌',
  'Mobile Covers': '📱',
  'Tempered Glass': '🛡️',
  'Earphones': '🎧',
  'Bluetooth Speakers': '🔊',
  'Power Banks': '🔋',
  'Adapters': '🔄',
  'Mobile Stands': '📐',
  'Smart Watches': '⌚',
};

export default function MobileFilterSidebar({
  isOpen,
  onClose,
  categories = [],
  selectedCategory,
  onSelectCategory,
  brands = [],
  selectedBrand,
  onSelectBrand,
  stockStatus,
  onStockChange,
  sort,
  onSortChange,
  totalResults = 0,
  onResetFilters,
  hasActiveFilters,
  activeFiltersCount = 0,
}) {
  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allCategories = [{ name: 'All Categories', slug: 'all' }, ...categories];

  return (
    <div
      className={`fixed inset-0 z-50 transition-visibility duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Filter and category menu"
    >
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-over Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 max-w-full flex w-full sm:max-w-md bg-[#0e1422] border-l border-slate-800 shadow-2xl flex-col transition-transform duration-300 ease-out z-10 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-[#121927]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-sm font-bold shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Filters & Categories
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Browse catalog taxonomy & inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-[#162032] hover:bg-[#1c2940] border border-slate-800 flex items-center justify-center transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 overscroll-contain no-scrollbar">
          {/* Section 1: Categories */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
              </span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => onSelectCategory('')}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Clear ({selectedCategory})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allCategories.map((cat) => {
                const isAll = cat.name === 'All Categories';
                const isSelected = isAll ? !selectedCategory : selectedCategory === cat.name;
                const icon = isAll ? '✨' : (CATEGORY_ICONS[cat.name] || '📦');

                return (
                  <button
                    key={cat.slug || cat.name}
                    type="button"
                    onClick={() => onSelectCategory(isAll ? '' : cat.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400/50 shadow-md shadow-blue-600/30 font-semibold'
                        : 'bg-[#131b2c] hover:bg-[#182339] text-slate-300 border-slate-800/90'
                    }`}
                  >
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="truncate flex-1">{cat.name}</span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Brands */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Brand
              </span>
              {selectedBrand && (
                <button
                  type="button"
                  onClick={() => onSelectBrand('')}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Clear ({selectedBrand})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectBrand('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border select-none ${
                  !selectedBrand
                    ? 'bg-blue-600 text-white border-blue-400/50 shadow-sm font-semibold'
                    : 'bg-[#131b2c] hover:bg-[#182339] text-slate-300 border-slate-800'
                }`}
              >
                All Brands
              </button>
              {brands.map((b) => {
                const isSelected = selectedBrand === b.name;
                return (
                  <button
                    key={b.slug || b.name}
                    type="button"
                    onClick={() => onSelectBrand(isSelected ? '' : b.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400/50 shadow-sm font-semibold'
                        : 'bg-[#131b2c] hover:bg-[#182339] text-slate-300 border-slate-800'
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Stock Status */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Stock Availability
            </span>
            <div className="grid grid-cols-3 gap-1.5 bg-[#121826] p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => onStockChange('')}
                className={`py-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer select-none ${
                  !stockStatus
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onStockChange('in_stock')}
                className={`py-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer select-none ${
                  stockStatus === 'in_stock'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => onStockChange('out_of_stock')}
                className={`py-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer select-none ${
                  stockStatus === 'out_of_stock'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          {/* Section 4: Sort Options */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Sort Products
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'latest', label: 'Newest First', icon: '⚡' },
                { id: 'price_asc', label: 'Price: Low to High', icon: '↗' },
                { id: 'price_desc', label: 'Price: High to Low', icon: '↘' },
                { id: 'name_asc', label: 'Name: A to Z', icon: '🔤' },
              ].map((s) => {
                const isSelected = sort === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSortChange(s.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold'
                        : 'bg-[#131b2c] hover:bg-[#182339] text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs">{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar Bottom Action Footer */}
        <div className="p-4 border-t border-slate-800/90 bg-[#121927] safe-area-pb space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Matching Inventory:</span>
            <span className="font-bold text-white">
              {totalResults} product{totalResults === 1 ? '' : 's'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>View {totalResults} Result{totalResults === 1 ? '' : 's'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
