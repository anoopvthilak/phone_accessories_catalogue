'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductImageUploader from '@/components/ProductImageUploader';

export default function AddProductPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [inStock, setInStock] = useState(true);
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specifications, setSpecifications] = useState({});
  const [compatibility, setCompatibility] = useState([]);
  const [customDevice, setCustomDevice] = useState('');
  const [warranty, setWarranty] = useState('1 Year Manufacturer Warranty');

  // UI state
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch categories & brands
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        if (catRes.ok) {
          const d = await catRes.json();
          setCategories(d.categories || []);
        }

        if (brandRes.ok) {
          const d = await brandRes.json();
          setBrands(d.brands || []);
        }
      } catch (err) {
        console.error('Error fetching categories/brands:', err);
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  // Toggle compatibility tag
  const toggleCompatibility = (device) => {
    if (compatibility.includes(device)) {
      setCompatibility(compatibility.filter((d) => d !== device));
    } else {
      setCompatibility([...compatibility, device]);
    }
  };

  // Add custom compatibility device
  const handleAddCustomDevice = (e) => {
    e.preventDefault();
    if (customDevice.trim() && !compatibility.includes(customDevice.trim())) {
      setCompatibility([...compatibility, customDevice.trim()]);
      setCustomDevice('');
    }
  };

  // Add specification
  const handleAddSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setSpecifications({
        ...specifications,
        [specKey.trim()]: specVal.trim(),
      });
      setSpecKey('');
      setSpecVal('');
    }
  };

  // Remove specification
  const handleRemoveSpec = (keyToRemove) => {
    const updated = { ...specifications };
    delete updated[keyToRemove];
    setSpecifications(updated);
  };

  const handleResetForm = () => {
    setName('');
    setCategoryId('');
    setBrandName('');
    setPrice('');
    setMrp('');
    setInStock(true);
    setImages([]);
    setDescription('');
    setSpecKey('');
    setSpecVal('');
    setSpecifications({});
    setCompatibility([]);
    setCustomDevice('');
    setWarranty('1 Year Manufacturer Warranty');
    setSuccess(false);
    setError('');
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!name.trim()) {
      setError('Product title is required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!brandName.trim()) {
      setError('Product brand is required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setError('Please enter a valid MOP');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const numPrice = parseFloat(price);
    const numMrp = mrp ? parseFloat(mrp) : numPrice;

    if (numMrp < numPrice) {
      setError('MRP cannot be lower than the MOP (selling price)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Default image fallback if none provided
    const finalImages =
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'];

    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          brand: brandName.trim(),
          brandName: brandName.trim(),
          price: numPrice,
          mrp: numMrp,
          inStock: inStock,
          status: inStock ? 'ACTIVE' : 'OUT_OF_STOCK',
          images: finalImages,
          description: description.trim(),
          specifications,
          compatibility,
          warranty: warranty.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Clear form data and navigate to product catalogue page
      handleResetForm();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-32 overflow-x-hidden">
      {/* Mobile Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#161f30] border border-slate-700/60 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span>Catalogue</span>
          </Link>

          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Add New Accessory
          </h1>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Banner */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-sm">Product Added to Catalogue!</h4>
                <p className="text-xs text-emerald-400/80">Available immediately for store staff search & viewing.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-xs font-semibold text-white border border-emerald-500/40"
              >
                + Add Another
              </button>
              <Link
                href="/"
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold text-center"
              >
                View Catalogue
              </Link>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Basic Information */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              1. Basic Information
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anker Prime 67W GaN Wall Charger"
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Category & Brand Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={categoryId}
                  required
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  required
                  list="brand-options"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Anker, Apple, boAt..."
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <datalist id="brand-options">
                  {brands.map((b) => (
                    <option key={b._id} value={b.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          {/* Card 2: Pricing & Stock Inventory */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              2. Pricing & Inventory
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  MOP (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full pl-8 pr-3 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  MRP (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="3999"
                    className="w-full pl-8 pr-3 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-300 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Stock Availability Toggle */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Stock Availability *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInStock(true)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${inStock
                      ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                      : 'bg-[#182234] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setInStock(false)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${!inStock
                      ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/60 shadow-md shadow-rose-500/10'
                      : 'bg-[#182234] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Out of Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Discount Preview */}
            {price && mrp && parseFloat(mrp) > parseFloat(price) && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <span>Calculated MOP Discount:</span>
                <strong className="font-bold">
                  {Math.round(((parseFloat(mrp) - parseFloat(price)) / parseFloat(mrp)) * 100)}% OFF
                </strong>
              </div>
            )}
          </section>

          {/* Card 3: Product Images (Up to 3, DigitalOcean Spaces) */}
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={3}
            disabled={loading}
          />

          {/* Card 4: Device Compatibility & Specifications */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl overflow-hidden">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              4. Compatibility & Specs
            </h2>

            {/* Device Compatibility */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Device Compatibility
              </label>

              {/* Custom Device Input */}
              <div className="flex gap-2 mb-3 min-w-0">
                <input
                  type="text"
                  value={customDevice}
                  onChange={(e) => setCustomDevice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomDevice(e);
                    }
                  }}
                  placeholder="Enter model name (e.g. Galaxy S24,..)"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDevice}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Add Model
                </button>
              </div>

              {/* Active Compatibility List */}
              {compatibility.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {compatibility.map((device) => (
                    <div
                      key={device}
                      className="max-w-full px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium"
                    >
                      <span className="break-all">{device}</span>
                      <button
                        type="button"
                        onClick={() => toggleCompatibility(device)}
                        className="text-amber-400/70 hover:text-amber-200 font-bold ml-1 cursor-pointer shrink-0"
                        title="Remove device"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No device models added yet.</p>
              )}
            </div>

            {/* Specifications Key-Value Pairs */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Specifications
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (specVal.trim()) {
                        handleAddSpec();
                      }
                    }
                  }}
                  placeholder="Feature (e.g. Wattage, Material)"
                  className="w-full min-w-0 px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                    placeholder="Value (e.g. 65W, Braided)"
                    className="flex-1 min-w-0 px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="shrink-0 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer transition flex items-center justify-center gap-1"
                    title="Add Specification"
                  >
                    <span>+</span>
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Active Specs list */}
              {Object.keys(specifications).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(specifications).map(([k, v]) => (
                    <div
                      key={k}
                      className="max-w-full px-3 py-1.5 rounded-xl bg-[#1b2538] border border-slate-700 text-xs flex items-center gap-2 text-slate-200"
                    >
                      <span className="text-slate-400 shrink-0">{k}:</span>
                      <span className="font-semibold break-all">{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(k)}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer shrink-0"
                        title={`Remove ${k}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Card 5: Description & Warranty */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              5. Description & Warranty
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product overview, packaging contents, key benefits..."
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Warranty
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 1 Year Replacement Warranty"
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </section>

          {/* Mobile Sticky Bottom Submit Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-800 px-4 py-3.5 shadow-2xl safe-area-pb">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || fetchingData}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving to Catalogue...</span>
                  </>
                ) : (
                  <span>💾 Save Accessory</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
