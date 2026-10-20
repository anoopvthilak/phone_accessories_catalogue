'use client';

export default function BrandFilter({
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
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 text-xs sm:text-sm">
      {/* Left: Brand Pills / Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-slate-400 font-medium text-xs mr-1 hidden sm:inline">
          Brand:
        </span>
        <button
          type="button"
          onClick={() => onSelectBrand('')}
          className={`px-3 py-1.5 rounded-xl font-medium text-xs transition cursor-pointer ${
            !selectedBrand
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
              : 'bg-[#121927] text-slate-400 hover:text-slate-200 border border-slate-800'
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
              className={`px-3 py-1.5 rounded-xl font-medium text-xs transition whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold'
                  : 'bg-[#121927] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {b.name}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Stock status, Sorting & Reset */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* Stock Toggle */}
        <select
          value={stockStatus}
          onChange={(e) => onStockChange(e.target.value)}
          className="bg-[#121927] border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
        >
          <option value="">All Stock</option>
          <option value="in_stock">In Stock Only</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        {/* Sort Options */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-[#121927] border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
        >
          <option value="latest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
