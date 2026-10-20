'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
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

  // Quick preset compatibility tags for mobile thumbs
  const POPULAR_DEVICES = [
    'iPhone 16 Pro',
    'iPhone 16',
    'iPhone 15 Pro',
    'iPhone 15',
    'Galaxy S24 Ultra',
    'Galaxy S24',
    'OnePlus 12',
    'Universal USB-C',
    'MagSafe Compatible',
  ];

  // Quick preset spec keys for mobile thumbs
  const QUICK_SPEC_KEYS = ['Output Wattage', 'Cable Length', 'Material', 'Color', 'Battery Life'];

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
          if (d.categories?.length > 0) {
            setCategoryId(d.categories[0]._id);
          }
        }

        if (brandRes.ok) {
          const d = await brandRes.json();
          setBrands(d.brands || []);
          if (d.brands?.length > 0) {
            setBrandId(d.brands[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching categories/brands:', err);
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  // Auto-generate SKU
  const handleGenerateSku = () => {
    const selectedBrand = brands.find((b) => b._id === brandId)?.name || 'ACC';
    const brandPrefix = selectedBrand.slice(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generated = `${brandPrefix}-${Date.now().toString().slice(-4)}-${randomSuffix}`;
    setSku(generated);
  };

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

  // Add image to list
  const handleAddImage = (urlToAdd) => {
    const targetUrl = urlToAdd || imageUrl;
    if (!targetUrl.trim()) return;

    if (targetUrl.startsWith('data:image/')) {
      setError('Image data-URIs / binaries are not allowed. Please enter an image URL.');
      return;
    }

    if (!images.includes(targetUrl.trim())) {
      setImages([...images, targetUrl.trim()]);
    }
    setImageUrl('');
    setError('');
  };

  // Remove image
  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
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

    if (!price || parseFloat(price) < 0) {
      setError('Please enter a valid retail price');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const numPrice = parseFloat(price);
    const numMrp = mrp ? parseFloat(mrp) : numPrice;

    if (numMrp < numPrice) {
      setError('MRP cannot be lower than the selling price');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Default image fallback if none provided
    const finalImages =
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'];

    // Auto-generate SKU if blank
    const finalSku = sku.trim() || `${brands.find((b) => b._id === brandId)?.name?.slice(0, 3) || 'ACC'}-${Date.now().toString(36).toUpperCase()}`;

    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          brandId,
          sku: finalSku,
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

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form after short delay or leave options
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setMrp('');
    setInStock(true);
    setImages([]);
    setDescription('');
    setSpecifications({});
    setCompatibility([]);
    setSuccess(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-32">
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
                Product Title / Name *
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
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
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
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SKU with Mobile Auto-generate button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  SKU (Stock Keeping Unit)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  ⚡ Auto Generate
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. ANK-67W-BLK"
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
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
                  Retail Price (₹) *
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
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      inStock
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
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      !inStock
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
                <span>Calculated Retail Discount:</span>
                <strong className="font-bold">
                  {Math.round(((parseFloat(mrp) - parseFloat(price)) / parseFloat(mrp)) * 100)}% OFF
                </strong>
              </div>
            )}
          </section>

          {/* Card 3: Product Images */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              3. Product Images (URLs)
            </h2>

            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="flex-1 px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => handleAddImage()}
                className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition cursor-pointer flex-shrink-0"
              >
                + Add
              </button>
            </div>

            {/* Quick Sample Image Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Sample Photos:</span>
              <button
                type="button"
                onClick={() => handleAddImage('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                ⚡ Charger
              </button>
              <button
                type="button"
                onClick={() => handleAddImage('https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                📱 Phone Case
              </button>
              <button
                type="button"
                onClick={() => handleAddImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                🔌 Cable
              </button>
            </div>

            {/* Added Images Thumbnail Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl bg-[#172032] overflow-hidden border border-slate-700 group">
                    <img src={img} alt="Product preview" className="w-full h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Card 4: Device Compatibility & Specifications */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              4. Compatibility & Specs
            </h2>

            {/* Quick Tap Compatibility Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Device Compatibility (Tap to select)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_DEVICES.map((device) => {
                  const isChecked = compatibility.includes(device);
                  return (
                    <button
                      key={device}
                      type="button"
                      onClick={() => toggleCompatibility(device)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                          : 'bg-[#182234] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {device}
                    </button>
                  );
                })}
              </div>

              {/* Custom Device Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDevice}
                  onChange={(e) => setCustomDevice(e.target.value)}
                  placeholder="Other model (e.g. iPad Air M2)"
                  className="flex-1 px-4 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDevice}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Add Model
                </button>
              </div>
            </div>

            {/* Specifications Key-Value Pairs */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Specifications
              </label>

              {/* Quick Spec Presets */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_SPEC_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSpecKey(k)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    + {k}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Feature (e.g. Wattage)"
                  className="px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    placeholder="Value (e.g. 65W)"
                    className="flex-1 px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Active Specs list */}
              {Object.keys(specifications).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(specifications).map(([k, v]) => (
                    <div
                      key={k}
                      className="px-3 py-1.5 rounded-xl bg-[#1b2538] border border-slate-700 text-xs flex items-center gap-2 text-slate-200"
                    >
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-semibold">{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(k)}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer"
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
