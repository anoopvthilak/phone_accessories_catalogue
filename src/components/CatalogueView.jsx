'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import BrandFilter from './BrandFilter';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import ProductDetailModal from './ProductDetailModal';

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

  const hasActiveFilters = !!(search || selectedCategory || selectedBrand || stockStatus);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Header Navbar */}
      <Header user={user} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-24 sm:pb-8">
        {/* Search Bar Section matching reference image */}
        <section className="space-y-3">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search equipment & accessories (e.g. 65W GaN, iPhone 15 case, Spigen...)"
          />

          {/* Horizontal Category Pill Filter matching reference image */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </section>

        {/* Section Title & Secondary Filter Strip */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {selectedCategory ? `${selectedCategory}` : 'Accessories Catalogue'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {loading
                  ? 'Searching inventory...'
                  : `${pagination.total} product${pagination.total === 1 ? '' : 's'} available`}
                {selectedBrand && ` from ${selectedBrand}`}
              </p>
            </div>
          </div>

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
