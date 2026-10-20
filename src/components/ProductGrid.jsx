'use client';

import ProductCard from './ProductCard';

export default function ProductGrid({
  products = [],
  loading = false,
  onSelectProduct,
  onResetFilters,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#121826] border border-slate-800/80 rounded-3xl p-4 animate-pulse flex flex-col justify-between"
          >
            <div>
              <div className="w-full aspect-[4/3] rounded-2xl bg-slate-800/50 mb-4" />
              <div className="h-3 bg-slate-800 rounded w-1/3 mb-2" />
              <div className="h-5 bg-slate-800 rounded w-4/5 mb-2" />
              <div className="h-4 bg-slate-800 rounded w-2/3 mb-4" />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="h-6 bg-slate-800 rounded w-24" />
              <div className="h-8 w-8 bg-slate-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-[#121826] border border-slate-800/80 rounded-3xl p-10 sm:p-16 text-center my-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          No accessories match your filters
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
          Try adjusting your search terms, removing active brand or category filters, or selecting All Stock.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
}
