"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Rental, api } from "../../lib/api";
import { formatRent, formatINR, formatArea, formatDate, capitalize } from "../../lib/utils";
import { 
  KeyRound, 
  MapPin, 
  Bed, 
  Maximize2, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  RotateCcw,
  Shield,
  Phone,
  User,
  Search
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

const PAGE_SIZE = 50;

export default function RentalsPage() {
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [sortBy, setSortBy] = useState("posted_at");
  const [order, setOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const [offset, setOffset] = useState(0);
  const [totalServer, setTotalServer] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRentals({
        offset,
        limit: PAGE_SIZE,
        locality: locality || undefined,
        bhk: bhk ? parseInt(bhk, 10) : undefined,
        sort_by: sortBy,
        order,
      });

      setRentals(res.results || []);
      setTotalServer(res.total || 0);
      setHasMore(res.has_more);
    } catch (err) {
      setError((err as Error).message || "Failed to load rental properties");
    } finally {
      setLoading(false);
    }
  }, [offset, locality, bhk, sortBy, order]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const handleReset = () => {
    setLocality("");
    setBhk("");
    setSortBy("posted_at");
    setOrder("desc");
    setSearchQuery("");
    setOffset(0);
  };

  const filteredRentals = rentals.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.apartment_name?.toLowerCase().includes(q) ||
      r.locality?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q)
    );
  });

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
          <KeyRound size={16} />
          <span>Rental Marketplace · Chennai</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Residential Properties for Rent
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "0.95rem" }}>
          Browse verified rental listings with transparent monthly rents, deposits, and carpet areas.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.95rem" }}>
            <SlidersHorizontal size={18} color="#38bdf8" />
            <span>Filter Rental Listings</span>
          </div>

          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}>
          {/* Keyword Search */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Search Apartment / Area
            </label>
            <div style={{ position: "relative" }}>
              <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "11px" }} />
              <input
                type="text"
                placeholder="e.g. Sobha, Guindy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-control"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "38px" }}
              />
            </div>
          </div>

          {/* Locality */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Locality
            </label>
            <select
              value={locality}
              onChange={(e) => { setLocality(e.target.value); setOffset(0); }}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Localities</option>
              {LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  {loc === "guindy" ? " (Assigned Locality)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Bedrooms */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Bedrooms (BHK)
            </label>
            <select
              value={bhk}
              onChange={(e) => { setBhk(e.target.value); setOffset(0); }}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Bedrooms</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Sort Rentals
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setOffset(0); }}
                className="input-control"
                style={{ fontSize: "0.85rem", height: "38px", flex: 2 }}
              >
                <option value="posted_at">Date Posted</option>
                <option value="price">Rent</option>
                <option value="carpet_area">Carpet Area</option>
                <option value="bedroom">Bedrooms</option>
              </select>
              <select
                value={order}
                onChange={(e) => { setOrder(e.target.value); setOffset(0); }}
                className="input-control"
                style={{ fontSize: "0.85rem", height: "38px", flex: 1 }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
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
          Showing <strong style={{ color: "var(--text-primary)" }}>{filteredRentals.length}</strong> rental listings
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

      {/* Loading Skeletons */}
      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel" style={{ height: "280px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Rentals Grid */}
      {!loading && filteredRentals.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}>
          {filteredRentals.map((rental) => (
            <div
              key={rental.listing_id}
              className="glass-panel animate-fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "22px",
                borderRadius: "var(--radius-md)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "var(--shadow-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-card)";
              }}
            >
              <div>
                {/* Top badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span className="badge badge-tag" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.3)" }}>
                      Rent
                    </span>
                    <span className="badge badge-tag">
                      {capitalize(rental.furnishing)}
                    </span>
                    {rental.locality.toLowerCase() === "guindy" && (
                      <span className="badge badge-tag" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                        ★ Guindy
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {rental.listing_id}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)" }}>
                  {rental.apartment_name}
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                  <MapPin size={14} color="#38bdf8" />
                  <span>{capitalize(rental.locality)}, Chennai</span>
                </div>

                {/* Specs Box */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  marginBottom: "16px",
                  fontSize: "0.85rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Bed size={15} color="#38bdf8" />
                    <span><strong>{rental.bedroom}</strong> BHK</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Maximize2 size={15} color="#38bdf8" />
                    <span>{formatArea(rental.carpet_area)}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Layers size={15} color="#38bdf8" />
                    <span>Floor {rental.floor}/{rental.total_floors}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                    <Shield size={15} color="#38bdf8" />
                    <span>Deposit: {formatINR(rental.deposit)}</span>
                  </div>
                </div>

                {rental.description && (
                  <p style={{
                    fontSize: "0.825rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.45,
                    marginBottom: "16px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {rental.description}
                  </p>
                )}
              </div>

              {/* Bottom Price and Contact */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "14px",
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                    Monthly Rent
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "-0.02em" }}>
                    {formatRent(rental.price)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <User size={13} color="var(--text-muted)" />
                    <span>{rental.posted_by_name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    <Phone size={11} />
                    <span>{rental.posted_by_contact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRentals.length === 0 && (
        <div className="glass-panel" style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            No rental properties found
          </h3>
          <p style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 20px" }}>
            No rentals matched your search or filters. Try adjusting your parameters.
          </p>
          <button onClick={handleReset} className="btn-primary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
