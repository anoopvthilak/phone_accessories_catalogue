'use client';

export default function CategoryFilter({ categories = [], selectedCategory, onSelectCategory }) {
  const allCategories = [{ name: 'All', slug: 'all' }, ...categories];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        {allCategories.map((cat) => {
          const isSelected =
            (!selectedCategory && cat.name === 'All') ||
            selectedCategory === cat.name;

          return (
            <button
              key={cat.slug || cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name === 'All' ? '' : cat.name)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 scale-[1.02]'
                  : 'bg-[#151d2c] hover:bg-[#1b263b] text-slate-300 hover:text-white border border-slate-800/90'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
