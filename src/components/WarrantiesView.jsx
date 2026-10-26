'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import NewWarrantyModal from './NewWarrantyModal';
import WarrantyClaimSlipModal from './WarrantyClaimSlipModal';

const WARRANTY_STATUSES = {
  RECEIVED_AT_SHOP: {
    label: 'Received at Shop',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    step: 1,
    desc: 'Item received at store counter, pending dispatch to brand',
  },
  SENT_TO_SERVICE_CENTER: {
    label: 'Sent to Brand Center',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
    step: 2,
    desc: 'Dispatched to brand / authorized service center',
  },
  UNDER_INSPECTION: {
    label: 'Under Inspection',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    step: 3,
    desc: 'Service center testing / inspecting reported fault',
  },
  REPLACED_OR_REPAIRED: {
    label: 'Replaced / Repaired',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-400',
    step: 4,
    desc: 'Claim approved: brand provided new unit or repaired product',
  },
  RECEIVED_BACK_AT_SHOP: {
    label: 'Back at Shop (Ready)',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
    step: 5,
    desc: 'Ready at shop counter for customer collection',
  },
  NOTIFIED_FOR_PICKUP: {
    label: 'Customer Notified',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 6,
    desc: 'Customer informed via phone/WhatsApp to collect',
  },
  DELIVERED_TO_CUSTOMER: {
    label: 'Delivered (Closed)',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot: 'bg-green-400',
    step: 7,
    desc: 'Product collected by customer, claim resolved',
  },
  REJECTED: {
    label: 'Claim Rejected',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    step: 0,
    desc: 'Warranty void / physical damage / denied by brand',
  },
};

const STEPPER_ORDER = [
  'RECEIVED_AT_SHOP',
  'SENT_TO_SERVICE_CENTER',
  'UNDER_INSPECTION',
  'REPLACED_OR_REPAIRED',
  'RECEIVED_BACK_AT_SHOP',
  'DELIVERED_TO_CUSTOMER',
];

export default function WarrantiesView({ initialUser }) {
  const [warranties, setWarranties] = useState([]);
  const [stats, setStats] = useState({
    TOTAL: 0,
    RECEIVED_AT_SHOP: 0,
    SENT_TO_SERVICE_CENTER: 0,
    UNDER_INSPECTION: 0,
    REPLACED_OR_REPAIRED: 0,
    RECEIVED_BACK_AT_SHOP: 0,
    NOTIFIED_FOR_PICKUP: 0,
    DELIVERED_TO_CUSTOMER: 0,
    REJECTED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [slipWarranty, setSlipWarranty] = useState(null);

  // Status update modal state
  const [statusModalItem, setStatusModalItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [serviceCenterName, setServiceCenterName] = useState('');
  const [serviceCenterRmaNo, setServiceCenterRmaNo] = useState('');
  const [replacedItem, setReplacedItem] = useState('');
  const [replacedItemResults, setReplacedItemResults] = useState([]);
  const [replacedItemSearching, setReplacedItemSearching] = useState(false);
  const [showReplacedDropdown, setShowReplacedDropdown] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Search catalogue for replaced item in status update modal
  useEffect(() => {
    const query = replacedItem?.trim();
    if (!statusModalItem || !query || query.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setReplacedItemSearching(true);
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setReplacedItemResults(data.products || []);
        }
      } catch (err) {
        console.error('Error searching replacement products:', err);
      } finally {
        setReplacedItemSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [replacedItem, statusModalItem]);

  const fetchWarranties = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeStatus && activeStatus !== 'ALL') {
        params.set('status', activeStatus);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }
      params.set('limit', '50');

      const res = await fetch(`/api/warranties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWarranties(data.warranties || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching warranties:', err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarranties();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchWarranties]);

  const handleOpenStatusModal = (item, targetStatus) => {
    setStatusModalItem(item);
    setNewStatus(targetStatus || item.status);
    setStatusNote('');
    setServiceCenterName(item.serviceCenterName || '');
    setServiceCenterRmaNo(item.serviceCenterRmaNo || '');
    setReplacedItem(item.replacedItem || '');
    setReplacedItemResults([]);
    setShowReplacedDropdown(false);
  };

  const handleUpdateStatus = async (e) => {
    e?.preventDefault();
    if (!statusModalItem || !newStatus) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/warranties/${statusModalItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          statusNote: statusNote.trim(),
          serviceCenterName: serviceCenterName.trim(),
          serviceCenterRmaNo: serviceCenterRmaNo.trim(),
          replacedItem: replacedItem.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWarranties((prev) =>
          prev.map((item) => (item._id === data.warranty._id ? data.warranty : item))
        );
        if (selectedWarranty?._id === data.warranty._id) {
          setSelectedWarranty(data.warranty);
        }
        setStatusModalItem(null);
        fetchWarranties();
      }
    } catch (err) {
      console.error('Error updating warranty status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getWhatsAppLink = (item) => {
    const cleanPhone = item.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    let message = `Hello ${item.customerName}, regarding your warranty ticket (${item.ticketNumber}) for "${item.productName}": `;

    if (item.status === 'RECEIVED_BACK_AT_SHOP' || item.status === 'NOTIFIED_FOR_PICKUP') {
      message += `Good news! Your product is ready for pickup at our accessories store counter. Please bring your claim slip or quote ticket ${item.ticketNumber}.`;
    } else if (item.status === 'SENT_TO_SERVICE_CENTER' || item.status === 'UNDER_INSPECTION') {
      message += `Your item is currently undergoing inspection/service at the brand service center. We will notify you as soon as it returns to our shop.`;
    } else if (item.status === 'REPLACED_OR_REPAIRED') {
      message += `Your warranty claim has been approved (Replaced/Repaired). It is being dispatched back to our shop.`;
    } else if (item.status === 'DELIVERED_TO_CUSTOMER') {
      message += `Thank you for choosing our accessories shop. Your warranty claim has been successfully closed.`;
    } else {
      message += `Current status: ${WARRANTY_STATUSES[item.status]?.label || item.status}. We are tracking your warranty request.`;
    }

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  // If there's an active phone search and we have direct matches, highlight the caller answer box
  const hasExactCallSearch = search.trim().length >= 3;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white pb-24 md:pb-12">
      <Header user={initialUser} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Customer Warranty & RMA Service Tracker
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live status tracking for customer repairs, brand replacements, and incoming caller inquiries
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 active:scale-95 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Intake New Warranty Item</span>
          </button>
        </div>

        {/* HERO CALLER SEARCH BOX (Designed for counter employee answering phone calls) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#121a30] via-[#0e1628] to-[#0d1322] border-2 border-indigo-500/40 shadow-2xl shadow-indigo-950/40">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Customer Calling Store? Instant Phone Lookup</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter customer phone number (e.g. 9876543210), Token ID (WRN-...), or Name..."
              className="w-full bg-[#18233c] border border-indigo-400/30 rounded-2xl pl-11 pr-24 py-3 sm:py-3.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner font-mono sm:font-sans"
            />
            <svg
              className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3.5 sm:top-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 sm:top-3 px-3 py-1 rounded-xl text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>Tip: Ask caller for their mobile number or claim token on their slip to give status instantly.</span>
          </div>
        </div>

        {/* Status Pipeline Cards (Filter Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <button
            type="button"
            onClick={() => setActiveStatus('ALL')}
            className={`p-3 rounded-2xl border text-left transition ${activeStatus === 'ALL'
                ? 'bg-[#161f33] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                : 'bg-[#0f1422] border-slate-800/80 hover:border-slate-700 text-slate-400'
              }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              All Tickets
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              {stats.TOTAL}
            </div>
          </button>

          {Object.keys(WARRANTY_STATUSES).map((st) => {
            const conf = WARRANTY_STATUSES[st];
            const isActive = activeStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setActiveStatus(st)}
                className={`p-3 rounded-2xl border text-left transition ${isActive
                    ? 'bg-[#161f33] border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-[#0f1422] border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 line-clamp-1">
                    {conf.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                </div>
                <div className="text-xl font-extrabold text-white mt-1">
                  {stats[st] || 0}
                </div>
              </button>
            );
          })}
        </div>

        {/* Warranties Grid List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading warranty records...</span>
          </div>
        ) : warranties.length === 0 ? (
          <div className="py-20 rounded-3xl bg-[#0f1422] border border-slate-800/80 text-center flex flex-col items-center justify-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No warranty claims found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {search
                ? `No ticket matching "${search}". Please verify phone number or token ID.`
                : 'No items currently in warranty intake under this filter.'}
            </p>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition"
            >
              + Record Warranty Intake
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warranties.map((item) => {
              const conf = WARRANTY_STATUSES[item.status] || WARRANTY_STATUSES.RECEIVED_AT_SHOP;
              const stepIdx = STEPPER_ORDER.indexOf(item.status);
              const latestLog = item.statusHistory?.[item.statusHistory.length - 1];

              return (
                <div
                  key={item._id}
                  className={`bg-[#0f1523] border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xl shadow-black/40 group relative ${hasExactCallSearch
                      ? 'border-indigo-500/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-800/90 hover:border-slate-700'
                    }`}
                >
                  <div>
                    {/* Top Row: Token ID & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg">
                          {item.ticketNumber}
                        </span>
                        {item.warrantyType && (
                          <span className="text-[9px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                            {item.warrantyType}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${conf.badge} hover:brightness-125 cursor-pointer`}
                        title="Click to advance status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                        <span>{conf.label}</span>
                        <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 mb-1 group-hover:text-indigo-400 transition-colors">
                      {item.productName}
                    </h3>
                    <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-2">
                      <span className="font-semibold text-slate-300">{item.brandName}</span>
                      {item.serialNumber && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-400">SN: {item.serialNumber}</span>
                        </>
                      )}
                    </div>

                    {/* Customer Info Card for Immediate Identification */}
                    <div className="p-3 rounded-2xl bg-[#141c2c] border border-slate-800/80 mb-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Customer:</span>
                        <span className="font-bold text-white">{item.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Phone:</span>
                        <a
                          href={`tel:${item.customerPhone}`}
                          className="font-mono text-blue-400 hover:underline font-semibold"
                        >
                          {item.customerPhone}
                        </a>
                      </div>
                      {(item.billNumber || item.billAmount !== null && item.billAmount !== undefined) && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400">Bill Ref:</span>
                          <span className="text-slate-300 font-mono">
                            {item.billNumber || '—'}
                            {item.billAmount !== null && item.billAmount !== undefined && (
                              <span className="text-indigo-400 font-semibold ml-1.5">
                                (₹{Number(item.billAmount).toLocaleString('en-IN')})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Replaced Item Banner if available */}
                    {item.replacedItem && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs mb-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-emerald-400">
                            Replaced Unit / Item:
                          </div>
                          <span className="font-semibold text-slate-200">{item.replacedItem}</span>
                        </div>
                        <span className="text-xs">🔄</span>
                      </div>
                    )}

                    {/* Reported Issue */}
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-3">
                      <div className="text-[10px] uppercase font-bold text-rose-400 mb-0.5">
                        Defect Reported:
                      </div>
                      <p className="line-clamp-2">{item.issueDescription}</p>
                    </div>

                    {/* Latest Status Note */}
                    {latestLog && latestLog.notes && (
                      <div className="p-2 rounded-xl bg-[#111726] border border-slate-800/60 text-[11px] text-slate-300 mb-3">
                        <span className="text-[10px] font-bold text-indigo-400 block mb-0.5">
                          Latest Progress Note:
                        </span>
                        <p className="line-clamp-2 italic">&ldquo;{latestLog.notes}&rdquo;</p>
                      </div>
                    )}

                    {/* Visual Stepper */}
                    <div className="mb-4">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Warranty Progress</span>
                        <span>
                          {stepIdx >= 0 ? `${stepIdx + 1} of 6` : item.status === 'REJECTED' ? 'Rejected' : 'In Process'}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        {STEPPER_ORDER.map((st, sIdx) => (
                          <div
                            key={st}
                            className={`h-full transition-all ${stepIdx >= sIdx
                                ? sIdx === 5
                                  ? 'bg-green-500'
                                  : 'bg-indigo-500'
                                : 'bg-slate-800'
                              }`}
                            title={WARRANTY_STATUSES[st]?.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Call Customer */}
                      <a
                        href={`tel:${item.customerPhone}`}
                        className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                        title="Call Customer Now"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>

                      {/* WhatsApp Update */}
                      <a
                        href={getWhatsAppLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                        title="Send WhatsApp Update"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>

                      {/* View & Print Slip */}
                      <button
                        type="button"
                        onClick={() => setSlipWarranty(item)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Print / View Customer Slip"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                    </div>

                    {/* Timeline History */}
                    <button
                      type="button"
                      onClick={() => setSelectedWarranty(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      History & Logs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Warranty Intake Modal */}
      <NewWarrantyModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={(created) => {
          fetchWarranties();
          // Optionally show claim slip immediately
          setSlipWarranty(created);
        }}
      />

      {/* Warranty Slip Modal */}
      <WarrantyClaimSlipModal
        warranty={slipWarranty}
        isOpen={!!slipWarranty}
        onClose={() => setSlipWarranty(null)}
      />

      {/* Status Transition Modal */}
      {statusModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setStatusModalItem(null)} />

          <div className="relative w-full max-w-lg bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Update Warranty Status
                </h3>
                <p className="text-xs text-slate-400">
                  {statusModalItem.ticketNumber} • {statusModalItem.customerName} ({statusModalItem.productName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Select Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Advance Stage to:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {Object.keys(WARRANTY_STATUSES).map((st) => {
                  const conf = WARRANTY_STATUSES[st];
                  const isCur = newStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${isCur
                          ? `${conf.badge} ring-1 ring-white/20`
                          : 'bg-[#141b2a] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                      <span className="truncate">{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Center RMA / Name (if dispatching to center) */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Brand Service Center Name
                </label>
                <input
                  type="text"
                  value={serviceCenterName}
                  onChange={(e) => setServiceCenterName(e.target.value)}
                  placeholder="e.g. boAt Authorized RMA Hub"
                  className="w-full bg-[#141b2a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Service Center RMA / Docket #
                </label>
                <input
                  type="text"
                  value={serviceCenterRmaNo}
                  onChange={(e) => setServiceCenterRmaNo(e.target.value)}
                  placeholder="e.g. RMA-99818"
                  className="w-full bg-[#141b2a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Replaced Item / Replacement Unit */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-slate-300">
                  Replaced Item / Replacement Unit <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-indigo-400 font-medium">Search catalogue</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={replacedItem}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReplacedItem(val);
                    if (!val || val.trim().length < 2) {
                      setReplacedItemResults([]);
                    }
                    setShowReplacedDropdown(true);
                  }}
                  onFocus={() => {
                    if (replacedItemResults.length > 0) setShowReplacedDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowReplacedDropdown(false), 200);
                  }}
                  placeholder="Type to search catalogue or enter custom replacement item..."
                  className="w-full bg-[#141b2a] border border-slate-800 rounded-xl px-3 py-1.5 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                {replacedItemSearching && (
                  <div className="absolute right-2.5 top-2 text-slate-400">
                    <svg className="w-3.5 h-3.5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                )}

                {!replacedItemSearching && replacedItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacedItem('');
                      setReplacedItemResults([]);
                      setShowReplacedDropdown(false);
                    }}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-white text-xs p-0.5"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown Suggestions */}
              {showReplacedDropdown && replacedItemResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121826] border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-800 max-h-40 overflow-y-auto">
                  {replacedItemResults.map((prod) => (
                    <div
                      key={prod._id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setReplacedItem(`${prod.name}${prod.brandName ? ` (${prod.brandName})` : ''}`);
                        setShowReplacedDropdown(false);
                        setReplacedItemResults([]);
                      }}
                      className="p-2 hover:bg-indigo-600/15 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">{prod.brandName} </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${prod.stock > 0
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                      >
                        {prod.stock > 0 ? `Stock: ${prod.stock}` : 'Out of Stock'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Progress Note (Visible when caller asks)
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched to brand center via BlueDart. Expected return next Tuesday..."
                className="w-full bg-[#141b2a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Save Warranty Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History & Details Modal */}
      {selectedWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setSelectedWarranty(null)} />

          <div className="relative w-full max-w-2xl bg-[#0f1422] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121826]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {selectedWarranty.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${WARRANTY_STATUSES[selectedWarranty.status]?.badge
                      }`}
                  >
                    {WARRANTY_STATUSES[selectedWarranty.status]?.label}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedWarranty.productName} ({selectedWarranty.brandName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#141b2a] border border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Customer</div>
                  <div className="font-bold text-white text-sm mt-0.5">{selectedWarranty.customerName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Phone</div>
                  <div className="font-mono text-blue-400 font-bold mt-0.5">{selectedWarranty.customerPhone}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Intake Date</div>
                  <div className="text-slate-200 mt-0.5">
                    {new Date(selectedWarranty.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Bill & Replacement Details */}
              {(selectedWarranty.billNumber || selectedWarranty.billAmount !== null && selectedWarranty.billAmount !== undefined || selectedWarranty.replacedItem || selectedWarranty.warrantyType) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-[#141b2a] border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Warranty Type</span>
                    <span className="text-slate-200 font-semibold">{selectedWarranty.warrantyType || 'Brand Warranty'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bill Number</span>
                    <span className="font-mono text-slate-300">{selectedWarranty.billNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bill Amount</span>
                    <span className="text-indigo-400 font-bold">
                      {selectedWarranty.billAmount !== null && selectedWarranty.billAmount !== undefined
                        ? `₹${Number(selectedWarranty.billAmount).toLocaleString('en-IN')}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Replaced Item</span>
                    <span className="text-emerald-400 font-medium truncate block" title={selectedWarranty.replacedItem}>
                      {selectedWarranty.replacedItem || '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Defect & Condition */}
              <div className="p-3.5 rounded-2xl bg-[#141b2a] border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">Reported Issue:</span>
                  <p className="text-rose-300 font-medium">{selectedWarranty.issueDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400">Condition:</span>{' '}
                    <span className="text-slate-300">{selectedWarranty.physicalCondition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Accessories:</span>{' '}
                    <span className="text-slate-300">{selectedWarranty.accessoriesIncluded}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Warranty Service Journey & Employee Logs</span>
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedWarranty.statusHistory && selectedWarranty.statusHistory.length > 0 ? (
                    selectedWarranty.statusHistory.map((hist, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-[#0f1422]" />
                        <div className="p-3 rounded-xl bg-[#131929] border border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-white">
                              {WARRANTY_STATUSES[hist.status]?.label || hist.status}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {new Date(hist.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          {hist.notes && (
                            <p className="text-slate-300 text-xs mb-1">
                              {hist.notes}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400">
                            Logged by: <span className="text-slate-300 font-semibold">{hist.updatedBy}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs">No status logs recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#121826] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const itm = selectedWarranty;
                    setSelectedWarranty(null);
                    handleOpenStatusModal(itm);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition"
                >
                  Update Stage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const itm = selectedWarranty;
                    setSelectedWarranty(null);
                    setSlipWarranty(itm);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
                >
                  Print Token Slip
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
