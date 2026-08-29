import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { itemService } from '../services/itemService';
import { CATEGORIES, LOCATIONS } from '../constants/itemConstants';
import ImageWithFallback from '../components/ImageWithFallback';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { Search, SlidersHorizontal, RefreshCw, X, Box, MapPin, Calendar, User, Eye, ArrowUpAZ, Sparkles } from 'lucide-react';

export default function BrowseItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States synced with URL
  const searchVal = searchParams.get('search') || '';
  const typeVal = searchParams.get('type') || 'all';
  const categoryVal = searchParams.get('category') || 'all';
  const locationVal = searchParams.get('location') || 'all';
  const dateRangeVal = searchParams.get('dateRange') || 'all';
  const customStartVal = searchParams.get('customStartDate') || '';
  const customEndVal = searchParams.get('customEndDate') || '';
  const sortVal = searchParams.get('sort') || 'newest';

  // Local Search Input state with Debounce optimization
  const [searchInput, setSearchInput] = useState(searchVal);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Pagination & Feeds States
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Mobile Filters Drawer visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Constants
  const LIMIT = 20;

  // Sync debounced search to URL query parameters
  useEffect(() => {
    if (debouncedSearch !== searchVal) {
      updateFilter('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  // Fetch data when query parameters or page changes
  const fetchItems = async (targetPage = 0, append = false) => {
    if (targetPage === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError('');

    const activeFilters = {
      search: searchVal,
      type: typeVal,
      category: categoryVal,
      location: locationVal,
      dateRange: dateRangeVal,
      customStartDate: customStartVal,
      customEndDate: customEndVal,
      sort: sortVal
    };

    try {
      const { data, count, error: fetchError } = await itemService.searchItems(activeFilters, targetPage, LIMIT);
      if (fetchError) throw fetchError;

      if (append) {
        setItems((prev) => {
          const map = new Map(prev.map((i) => [i.id, i]));
          (data || []).forEach((i) => map.set(i.id, i));
          return Array.from(map.values());
        });
      } else {
        setItems(data || []);
      }

      setTotalCount(count || 0);
      setHasMore((data || []).length === LIMIT && (targetPage + 1) * LIMIT < (count || 0));
      setPage(targetPage);
    } catch (err) {
      console.error('Error browsing items:', err.message);
      setError(getFriendlyErrorMessage(err, 'Could not query reports database.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger queries on url search parameter changes
  useEffect(() => {
    fetchItems(0, false);
  }, [searchParams]);

  // Helper to update specific search parameter values
  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Reset page back to 0 on filter update
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchItems(page + 1, true);
    }
  };

  // Compile active chips (tags showing applied filters)
  const getActiveChips = () => {
    const chips = [];
    if (searchVal) chips.push({ key: 'search', label: `Search: "${searchVal}"` });
    if (typeVal !== 'all') chips.push({ key: 'type', label: typeVal === 'lost' ? 'Lost' : 'Found' });
    if (categoryVal !== 'all') chips.push({ key: 'category', label: categoryVal });
    if (locationVal !== 'all') chips.push({ key: 'location', label: locationVal });
    if (dateRangeVal !== 'all') {
      let label = 'Date';
      if (dateRangeVal === 'today') label = 'Today';
      if (dateRangeVal === '7days') label = 'Last 7 days';
      if (dateRangeVal === '30days') label = 'Last 30 days';
      if (dateRangeVal === 'custom') label = `${customStartVal || '...'} to ${customEndVal || '...'}`;
      chips.push({ key: 'dateRange', label });
    }
    return chips;
  };

  const activeChips = getActiveChips();

  // Card items status config mapping
  const typeConfig = {
    lost: { color: 'bg-rose-50 border-rose-100 text-rose-600', label: 'Lost' },
    found: { color: 'bg-emerald-50 border-emerald-100 text-emerald-600', label: 'Found' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Header text */}
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Browse Lost & Found</h1>
        <p className="text-sm text-slate-500 font-medium">
          Find items reported around SBJain campus.
        </p>
      </div>

      {/* Query search and controls layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Desktop Filter Bar (hidden on mobile) */}
        <div className="hidden lg:block bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6 shrink-0">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              Filter Items
            </h3>
            {activeChips.length > 0 && (
              <button 
                onClick={handleClearFilters}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['all', 'lost', 'found'].map((t) => (
                <button
                  key={t}
                  onClick={() => updateFilter('type', t)}
                  className={`py-1.5 rounded-lg text-xs font-semibold text-center border capitalize transition-all cursor-pointer ${
                    typeVal === t 
                      ? 'bg-primary-500 border-primary-500 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider" htmlFor="desk-cat">Category</label>
            <select
              id="desk-cat"
              value={categoryVal}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100/70 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider" htmlFor="desk-loc">Campus Location</label>
            <select
              id="desk-loc"
              value={locationVal}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100/70 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider" htmlFor="desk-date">Date Period</label>
            <select
              id="desk-date"
              value={dateRangeVal}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100/70 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {dateRangeVal === 'custom' && (
              <div className="space-y-2 pt-2 animate-[slideDown_0.2s_ease-out]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">Start Date</span>
                  <input
                    type="date"
                    value={customStartVal}
                    onChange={(e) => updateFilter('customStartDate', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">End Date</span>
                  <input
                    type="date"
                    value={customEndVal}
                    onChange={(e) => updateFilter('customEndDate', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider" htmlFor="desk-sort">Sort By</label>
            <select
              id="desk-sort"
              value={sortVal}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100/70 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-lg outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

        </div>

        {/* Right Side: Main list results & Search panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search Box & Mobile Filter Trigger */}
          <div className="flex gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-grow">
              <input
                type="text"
                placeholder="Search items by name, details..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-150 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-2xl outline-none shadow-xs transition-all duration-200 text-slate-800 font-medium"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </form>

            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center justify-center p-3 bg-white border border-slate-150 rounded-2xl shadow-xs text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Active Chips Bar */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center select-none animate-[fadeIn_0.2s_ease-out]">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Active:</span>
              {activeChips.map((chip) => (
                <div 
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span>{chip.label}</span>
                  <button 
                    onClick={() => {
                      if (chip.key === 'search') setSearchInput('');
                      updateFilter(chip.key, 'all');
                      if (chip.key === 'dateRange') {
                        updateFilter('customStartDate', '');
                        updateFilter('customEndDate', '');
                      }
                    }}
                    className="hover:text-rose-600 shrink-0 cursor-pointer p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Result Count summary */}
          {!loading && (
            <div className="text-xs font-semibold text-slate-400 flex justify-between items-center uppercase tracking-wider">
              <span>{totalCount} {totalCount === 1 ? 'item' : 'items'} found</span>
              {sortVal === 'oldest' && (
                <span className="flex items-center gap-1 text-[10px] text-primary-500 font-bold">
                  <ArrowUpAZ className="w-3.5 h-3.5" />
                  Oldest First Sorted
                </span>
              )}
            </div>
          )}

          {/* Results grid */}
          {loading ? (
            <div className="py-20 bg-white/50 border border-slate-100 rounded-3xl">
              <LoadingSpinner size="medium" text="Searching Collegiate Registry..." />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No matching items found"
              description="Try changing your search keywords or resetting filter configurations."
              actionLabel="Clear All Filters"
              onAction={handleClearFilters}
            />
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {items.map((item) => {
                  const dateFormatted = new Date(item.date_occurred).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  const typeDetails = typeConfig[item.type] || typeConfig.lost;

                  return (
                    <Link
                      key={item.id}
                      to={`/items/${item.id}`}
                      className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer h-[320px]"
                    >
                      {/* Image block thumbnail */}
                      <div className="bg-slate-50 border-b border-slate-50 h-36 flex items-center justify-center relative overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />

                        <span className={`absolute top-3 left-3 px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs ${typeDetails.color}`}>
                          {typeDetails.label}
                        </span>
                      </div>

                      {/* Info block */}
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">{item.category}</span>
                          <h4 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors text-sm line-clamp-1 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Badges footer */}
                        <div className="space-y-1 pt-2 border-t border-slate-50 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1 line-clamp-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{dateFormatted}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Load More trigger */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all rounded-xl shadow-xs text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-55"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      'Load More Items'
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Mobile Drawer Slide-open modal (hidden on desktop) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/40 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
          
          {/* Close tap helper */}
          <div className="flex-grow" onClick={() => setMobileFiltersOpen(false)} />

          {/* Drawer sheet container */}
          <div className="w-80 bg-white h-full flex flex-col justify-between p-6 shadow-2xl animate-[slideLeft_0.25s_ease-out]">
            
            <div className="space-y-6 overflow-y-auto pr-1">
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Mobile Type */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Type</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['all', 'lost', 'found'].map((t) => (
                    <button
                      key={t}
                      onClick={() => updateFilter('type', t)}
                      className={`py-1.5 rounded-lg text-xs font-semibold text-center border capitalize ${
                        typeVal === t 
                          ? 'bg-primary-500 border-primary-500 text-white font-bold' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Category */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="mob-cat">Category</span>
                <select
                  id="mob-cat"
                  value={categoryVal}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Location */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="mob-loc">Location</span>
                <select
                  id="mob-loc"
                  value={locationVal}
                  onChange={(e) => updateFilter('location', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="all">All Locations</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Date Period */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="mob-date">Date Period</span>
                <select
                  id="mob-date"
                  value={dateRangeVal}
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="custom">Custom Date Range</option>
                </select>

                {dateRangeVal === 'custom' && (
                  <div className="space-y-2 pt-2 animate-[slideDown_0.2s_ease-out]">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">Start Date</span>
                      <input
                        type="date"
                        value={customStartVal}
                        onChange={(e) => updateFilter('customStartDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">End Date</span>
                      <input
                        type="date"
                        value={customEndVal}
                        onChange={(e) => updateFilter('customEndDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Sort */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="mob-sort">Sort By</span>
                <select
                  id="mob-sort"
                  value={sortVal}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button 
                onClick={handleClearFilters}
                className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 text-center cursor-pointer"
              >
                Reset
              </button>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="py-2.5 bg-primary-500 text-white rounded-xl text-xs font-bold text-center hover:bg-primary-600 cursor-pointer shadow-xs"
              >
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
