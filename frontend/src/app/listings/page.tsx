"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Listing, api } from "../../lib/api";
import { ListingCard } from "../../components/ListingCard";
import { useAuth } from "../../lib/auth-context";
import { 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Building,
  CheckCircle2
} from "lucide-react";

const LOCALITIES = [
  "adyar",
  "anna nagar",
  "guindy",
  "omr",
  "perungudi",
  "porur",
  "t nagar",
  "tambaram",
  "thoraipakkam",
  "velachery",
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "independent house", label: "Independent House" },
  { value: "builder floor", label: "Builder Floor" },
];

const FURNISHINGS = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "fully-furnished", label: "Fully-Furnished" },
];

const PAGE_SIZE = 50;

export default function ListingsPage() {
  const { isAuthenticated } = useAuth();

  // Server-supported filters
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [sortBy, setSortBy] = useState("posted_at");
  const [order, setOrder] = useState("desc");

  // Client-side required filters (Server silently ignores min_price, max_price, furnishing)
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [furnishing, setFurnishing] = useState("");
  const [onlyLive, setOnlyLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [totalServer, setTotalServer] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Data state
  const [rawListings, setRawListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved listings to highlight hearts
  useEffect(() => {
    if (isAuthenticated) {
      api.getSaved()
        .then((res) => {
          setSavedIds(new Set(res.results.map((l) => l.listing_id)));
        })
        .catch(() => {});
    } else {
      setSavedIds(new Set());
    }
  }, [isAuthenticated]);

  // Load listings from API
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.getListings({
        offset,
        limit: PAGE_SIZE,
        locality: locality || undefined,
        bhk: bhk ? parseInt(bhk, 10) : undefined,
        property_type: propertyType || undefined,
        sort_by: sortBy,
        order,
      });

      setRawListings(res.results || []);
      setTotalServer(res.total || 0);
      setHasMore(res.has_more);
    } catch (err) {
      setError((err as Error).message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [offset, locality, bhk, propertyType, sortBy, order]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle filter changes (resets pagination to offset 0)
  const handleServerFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setOffset(0);
  };

  const handleResetFilters = () => {
    setLocality("");
    setBhk("");
    setPropertyType("");
    setFurnishing("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyLive(false);
    setSearchQuery("");
    setSortBy("posted_at");
    setOrder("desc");
    setOffset(0);
  };

  // Client-side filtering for parameters ignored by server:
  // - min_price
  // - max_price
  // - furnishing
  // - search query in apartment_name
  // - is_live status toggle
  const filteredListings = useMemo(() => {
    return rawListings.filter((item) => {
      // 1. Client-side Price Range
      const pMin = minPrice ? parseFloat(minPrice) : null;
      const pMax = maxPrice ? parseFloat(maxPrice) : null;
      if (pMin !== null && item.price < pMin) return false;
      if (pMax !== null && item.price > pMax) return false;

      // 2. Client-side Furnishing
      if (furnishing && item.furnishing !== furnishing) return false;

      // 3. Client-side Only Live toggle
      if (onlyLive && !item.is_live) return false;

      // 4. Client-side Apartment Name Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.apartment_name?.toLowerCase().includes(q);
        const matchesLoc = item.locality?.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc) return false;
      }

      return true;
    });
  }, [rawListings, minPrice, maxPrice, furnishing, onlyLive, searchQuery]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Page Title & Intro */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#818cf8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
          <Building size={16} />
          <span>Residential Marketplace · Chennai</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Explore Properties For Sale
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "0.95rem" }}>
          Browse retrievable sale listings with verified client-side price, furnishing, and locality filtering.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.95rem" }}>
            <SlidersHorizontal size={18} color="#818cf8" />
            <span>Search & Filter Parameters</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Row 1: Search & Server-Side Filters */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}>
          {/* Keyword Search */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Search Apartment
            </label>
            <div style={{ position: "relative" }}>
              <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "11px" }} />
              <input
                type="text"
                placeholder="e.g. Prestige, Sobha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-control"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "38px" }}
              />
            </div>
          </div>

          {/* Locality (Server-side) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Locality
            </label>
            <select
              value={locality}
              onChange={(e) => handleServerFilterChange(setLocality, e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Localities</option>
              {LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms (Server-side) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Bedrooms (BHK)
            </label>
            <select
              value={bhk}
              onChange={(e) => handleServerFilterChange(setBhk, e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Bedrooms</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5 BHK</option>
            </select>
          </div>

          {/* Property Type (Server-side) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => handleServerFilterChange(setPropertyType, e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Client-side Filtered fields (Ignored by server) + Sort */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          {/* Min Price (Client Filter) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Min Price (₹) <span style={{ color: "#818cf8", fontSize: "0.7rem" }}>[Client filtered]</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 5000000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            />
          </div>

          {/* Max Price (Client Filter) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Max Price (₹) <span style={{ color: "#818cf8", fontSize: "0.7rem" }}>[Client filtered]</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 15000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            />
          </div>

          {/* Furnishing (Client Filter) */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Furnishing <span style={{ color: "#818cf8", fontSize: "0.7rem" }}>[Client filtered]</span>
            </label>
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Furnishing</option>
              {FURNISHINGS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Sort By
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={sortBy}
                onChange={(e) => handleServerFilterChange(setSortBy, e.target.value)}
                className="input-control"
                style={{ fontSize: "0.85rem", height: "38px", flex: 2 }}
              >
                <option value="posted_at">Date Posted</option>
                <option value="price">Price</option>
                <option value="carpet_area">Area</option>
                <option value="bedroom">Bedrooms</option>
              </select>
              <select
                value={order}
                onChange={(e) => handleServerFilterChange(setOrder, e.target.value)}
                className="input-control"
                style={{ fontSize: "0.85rem", height: "38px", flex: 1 }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Toggle */}
        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={onlyLive}
              onChange={(e) => setOnlyLive(e.target.checked)}
              style={{ accentColor: "var(--accent-primary)", width: "16px", height: "16px" }}
            />
            <span>Show Only Active / Live Listings (`is_live: true`)</span>
          </label>
        </div>
      </div>

      {/* Results Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Showing <strong style={{ color: "var(--text-primary)" }}>{filteredListings.length}</strong> listings
          {" "}(Page {currentPage}, offset {offset})
          {totalServer > 0 && <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>· server reported total: {totalServer}</span>}
        </div>

        {/* Pagination Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0 || loading}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ fontSize: "0.85rem", fontWeight: 600, padding: "0 8px", color: "var(--text-primary)" }}>
            {currentPage}
          </span>

          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={!hasMore || loading}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          backgroundColor: "rgba(244, 63, 94, 0.12)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          color: "#fb7185",
          padding: "16px 20px",
          borderRadius: "var(--radius-sm)",
          marginBottom: "24px",
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel" style={{ height: "300px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Listings Grid */}
      {!loading && filteredListings.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}>
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.listing_id}
              listing={listing}
              isSavedInitial={savedIds.has(listing.listing_id)}
              onSaveToggle={(id, isSaved) => {
                const next = new Set(savedIds);
                if (isSaved) next.add(id);
                else next.delete(id);
                setSavedIds(next);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredListings.length === 0 && (
        <div className="glass-panel" style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <Search size={26} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            No listings found
          </h3>
          <p style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 20px" }}>
            No listings matched your active filters on this page. Try clearing or expanding your search criteria.
          </p>
          <button onClick={handleResetFilters} className="btn-primary">
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
