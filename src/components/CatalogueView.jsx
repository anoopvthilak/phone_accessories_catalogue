'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import BrandFilter from './BrandFilter';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import ProductDetailModal from './ProductDetailModal';
import MobileFilterSidebar from './MobileFilterSidebar';

export default function CatalogueView({ initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  // Mobile filter sidebar state
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Selected product for detail modal view
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch categories and brands once
  useEffect(() => {
    async function fetchTaxonomies() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (brandRes.ok) {
          const brandData = await brandRes.json();
          setBrands(brandData.brands || []);
        }
      } catch (err) {
        console.error('Error fetching categories/brands:', err);
      }
    }

    fetchTaxonomies();
  }, []);

  // Fetch products based on current search & filter parameters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (stockStatus) params.set('stock', stockStatus);
      if (sort) params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load products');
      }

      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (error) {
      console.error('Catalogue fetch error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedBrand, stockStatus, sort, page]);

  useEffect(() => {
    let isCancelled = false;
    const runFetch = async () => {
      if (!isCancelled) {
        await fetchProducts();
      }
    };
    runFetch();
    return () => {
      isCancelled = true;
    };
  }, [fetchProducts]);

  // Handle category change (reset page)
  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    setPage(1);
  };

  // Handle brand change (reset page)
  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
    setPage(1);
  };

  // Handle search change (reset page)
  const handleSearchChange = (query) => {
    setSearch(query);
    setPage(1);
  };

  // Handle stock change (reset page)
  const handleStockChange = (status) => {
    setStockStatus(status);
    setPage(1);
  };

  // Handle sort change (reset page)
  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setStockStatus('');
    setSort('latest');
    setPage(1);
  };

  const hasActiveFilters = !!(search || selectedCategory || selectedBrand || stockStatus || sort !== 'latest');

  const activeFiltersCount = [
    Boolean(selectedCategory),
    Boolean(selectedBrand),
    Boolean(stockStatus),
    sort !== 'latest',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Header Navbar */}
      <Header user={user} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6 pb-24 sm:pb-8">
        {/* Sticky Search Bar Section & Mobile Filter Trigger */}
        <section className="sticky top-[56px] sm:top-[57px] md:static z-20 bg-[#0b0f19]/95 backdrop-blur-md pt-2 pb-2.5 px-3.5 -mx-3.5 border-b border-slate-800/80 md:border-b-0 md:p-0 md:m-0 md:bg-transparent md:backdrop-blur-none transition-all space-y-2 md:space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchBar
                value={search}
                onChange={handleSearchChange}
                placeholder="Search accessories (e.g. 65W GaN, iPhone case, Spigen...)"
              />
            </div>

            {/* Mobile Hamburger / Filter Drawer Button */}
            <button
              type="button"
              onClick={() => setIsFilterSidebarOpen(true)}
              className={`md:hidden relative flex items-center justify-center gap-2 px-3.5 h-[48px] rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 select-none shrink-0 ${
                activeFiltersCount > 0
                  ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'bg-[#141b2a] hover:bg-[#182337] border-slate-800 text-slate-300'
              }`}
              aria-label="Open filter and category sidebar"
              aria-expanded={isFilterSidebarOpen}
              title="Filters & Categories"
            >
              {/* Hamburger Icon with Filter Line */}
              <div className="flex flex-col justify-center items-center w-5 h-5 gap-1.5">
                <span
                  className={`w-5 h-0.5 rounded-full transition-colors ${
                    activeFiltersCount > 0 ? 'bg-blue-400' : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`w-5 h-0.5 rounded-full transition-colors ${
                    activeFiltersCount > 0 ? 'bg-blue-400' : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`w-3.5 h-0.5 rounded-full self-start transition-colors ${
                    activeFiltersCount > 0 ? 'bg-blue-400' : 'bg-slate-400'
                  }`}
                />
              </div>

              <span className="text-xs font-semibold hidden xs:inline">
                Filters
              </span>

              {/* Active Filter Count Badge */}
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold border-2 border-[#0b0f19] shadow-md shadow-blue-500/50">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Active Filter Badges Strip (Quick One-Tap Dismiss) */}
          {hasActiveFilters && (
            <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 whitespace-nowrap active:scale-95 transition"
                  title="Remove category filter"
                >
                  <span>{selectedCategory}</span>
                  <span className="text-[10px] text-blue-400 hover:text-white">✕</span>
                </button>
              )}

              {selectedBrand && (
                <button
                  type="button"
                  onClick={() => handleBrandSelect('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 whitespace-nowrap active:scale-95 transition"
                  title="Remove brand filter"
                >
                  <span>{selectedBrand}</span>
                  <span className="text-[10px] text-blue-400 hover:text-white">✕</span>
                </button>
              )}

              {stockStatus && (
                <button
                  type="button"
                  onClick={() => handleStockChange('')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap active:scale-95 transition"
                  title="Remove stock filter"
                >
                  <span>{stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}</span>
                  <span className="text-[10px] text-amber-400 hover:text-white">✕</span>
                </button>
              )}

              {sort !== 'latest' && (
                <button
                  type="button"
                  onClick={() => handleSortChange('latest')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap active:scale-95 transition"
                  title="Reset sort"
                >
                  <span>
                    {sort === 'price_asc' && 'Price ↑'}
                    {sort === 'price_desc' && 'Price ↓'}
                    {sort === 'name_asc' && 'A-Z'}
                  </span>
                  <span className="text-[10px] text-indigo-400 hover:text-white">✕</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 whitespace-nowrap transition cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Desktop Horizontal Category Pill Filter (Hidden on mobile) */}
          <div className="hidden md:block">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        </section>

        {/* Section Title & Secondary Filter Strip */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                {selectedCategory ? `${selectedCategory}` : 'Accessories Catalogue'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {loading
                  ? 'Searching inventory...'
                  : `${pagination.total} product${pagination.total === 1 ? '' : 's'} available`}
                {selectedBrand && ` from ${selectedBrand}`}
              </p>
            </div>

            {/* Mobile quick trigger button next to header title */}
            <button
              type="button"
              onClick={() => setIsFilterSidebarOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#131b2c] text-slate-300 hover:text-white border border-slate-800 active:scale-95 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter & Sort</span>
              {activeFiltersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </button>
          </div>

          {/* Desktop Brand Filter Strip (Hidden on mobile) */}
          <div className="hidden md:block">
            <BrandFilter
              brands={brands}
              selectedBrand={selectedBrand}
              onSelectBrand={handleBrandSelect}
              stockStatus={stockStatus}
              onStockChange={handleStockChange}
              sort={sort}
              onSortChange={handleSortChange}
              totalResults={pagination.total}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </section>

        {/* Product Grid */}
        <section>
          <ProductGrid
            products={products}
            loading={loading}
            onSelectProduct={(product) => setSelectedProduct(product)}
            onResetFilters={handleResetFilters}
          />
        </section>

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </main>

      {/* Footer */}
      <footer className="hidden sm:block border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <p>Phone Accessories Retail Store Catalogue • Internal Management Portal</p>
      </footer>

      {/* Mobile Filter & Categories Slide-Over Sidebar Drawer */}
      <MobileFilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={handleBrandSelect}
        stockStatus={stockStatus}
        onStockChange={handleStockChange}
        sort={sort}
        onSortChange={handleSortChange}
        totalResults={pagination.total}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          user={user}
          onClose={() => setSelectedProduct(null)}
          onProductDeleted={(deletedId) => {
            setProducts((prev) => prev.filter((p) => p._id !== deletedId));
            setPagination((prev) => ({
              ...prev,
              total: Math.max(0, prev.total - 1),
            }));
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
