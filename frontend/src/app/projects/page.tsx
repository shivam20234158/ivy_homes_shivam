"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Project, api } from "../../lib/api";
import { formatINR, formatProjectPriceRange, projectPriceToINR, capitalize } from "../../lib/utils";
import { 
  Building2, 
  MapPin, 
  Maximize2, 
  Layers, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  RotateCcw,
  CheckCircle,
  Tag,
  Search,
  AlertCircle
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

export default function ProjectsPage() {
  const [locality, setLocality] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("total_units");
  const [order, setOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const [offset, setOffset] = useState(0);
  const [totalServer, setTotalServer] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProjects({
        offset,
        limit: PAGE_SIZE,
        locality: locality || undefined,
        project_status: status || undefined,
        sort_by: sortBy,
        order,
      });

      setProjects(res.results || []);
      setTotalServer(res.total || 0);
      setHasMore(res.has_more);
    } catch (err) {
      setError((err as Error).message || "Failed to load builder projects");
    } finally {
      setLoading(false);
    }
  }, [offset, locality, status, sortBy, order]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleReset = () => {
    setLocality("");
    setStatus("");
    setSortBy("total_units");
    setOrder("desc");
    setSearchQuery("");
    setOffset(0);
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.apartment_name?.toLowerCase().includes(q) ||
      p.developer_name?.toLowerCase().includes(q) ||
      p.locality?.toLowerCase().includes(q)
    );
  });

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
          <Building2 size={16} />
          <span>New Developments · Chennai</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Builder Developments & Projects
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "0.95rem" }}>
          Browse premier residential developments with normalized unit pricing (Lakhs & Crores conversion applied).
        </p>
      </div>

      {/* Info Notice about Units Correction */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 18px",
        marginBottom: "28px",
        fontSize: "0.875rem",
        color: "#c7d2fe",
      }}>
        <AlertCircle size={18} color="#818cf8" style={{ flexShrink: 0 }} />
        <div>
          <strong>Price Normalization Notice:</strong> Raw API fields report prices as decimal quantities in mixed units (values &lt; 10 in Crores, values &ge; 10 in Lakhs). This portal displays the computed, true INR currency equivalents.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: "20px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.95rem" }}>
            <SlidersHorizontal size={18} color="#a855f7" />
            <span>Filter Projects</span>
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
          {/* Search */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Project or Developer
            </label>
            <div style={{ position: "relative" }}>
              <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "11px" }} />
              <input
                type="text"
                placeholder="e.g. Brigade, Sobha..."
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
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
              className="input-control"
              style={{ fontSize: "0.85rem", height: "38px" }}
            >
              <option value="">All Statuses</option>
              <option value="under construction">Under Construction</option>
              <option value="ready to move">Ready to Move</option>
              <option value="new launch">New Launch</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "5px" }}>
              Sort Projects
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setOffset(0); }}
                className="input-control"
                style={{ fontSize: "0.85rem", height: "38px", flex: 2 }}
              >
                <option value="total_units">Total Units</option>
                <option value="launch_date">Launch Date</option>
                <option value="price_min">Min Price</option>
                <option value="price_max">Max Price</option>
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
          Showing <strong style={{ color: "var(--text-primary)" }}>{filteredProjects.length}</strong> projects
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

      {/* Loading */}
      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "24px",
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel" style={{ height: "320px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && filteredProjects.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "24px",
        }}>
          {filteredProjects.map((project) => {
            const priceRangeDisplay = formatProjectPriceRange(project.price_min, project.price_max);
            return (
              <div
                key={project.project_id}
                className="glass-panel animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "24px",
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
                  {/* Header Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="badge badge-tag" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.3)" }}>
                        {capitalize(project.project_status)}
                      </span>
                      <span className="badge badge-tag">
                        {project.total_units} Units
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {project.project_id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "4px", color: "var(--text-primary)" }}>
                    {project.apartment_name}
                  </h3>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    By <strong style={{ color: "var(--text-primary)" }}>{project.developer_name}</strong>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                    <MapPin size={14} color="#c084fc" />
                    <span>{capitalize(project.locality)}, Chennai</span>
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
                      <Maximize2 size={15} color="#c084fc" />
                      <span>{project.min_area_sqft} - {project.max_area_sqft} sq ft</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                      <Layers size={15} color="#c084fc" />
                      <span>{project.total_towers} Towers · {project.total_floors} Floors</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                      <Calendar size={15} color="#c084fc" />
                      <span>Possession: {project.possession_date || "TBD"}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                      <Tag size={15} color="#c084fc" />
                      <span>{project.total_listings} Available Listings</span>
                    </div>
                  </div>

                  {/* Amenities tags */}
                  {project.amenities && project.amenities.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {project.amenities.slice(0, 4).map((am, idx) => (
                        <span key={idx} style={{
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          color: "var(--text-secondary)",
                          textTransform: "capitalize",
                        }}>
                          ✓ {am}
                        </span>
                      ))}
                      {project.amenities.length > 4 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
                          +{project.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* RERA */}
                  {project.rera_number && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                      RERA: <span style={{ fontFamily: "var(--font-mono)" }}>{project.rera_number}</span>
                    </div>
                  )}
                </div>

                {/* Pricing row */}
                <div style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Price Range
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#c084fc", letterSpacing: "-0.02em" }}>
                      {priceRangeDisplay}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                    <div>Raw API values:</div>
                    <div style={{ fontFamily: "var(--font-mono)" }}>
                      {project.price_min} - {project.price_max}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="glass-panel" style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            No builder projects found
          </h3>
          <p style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 20px" }}>
            No projects matched your search or filters. Try clearing filters.
          </p>
          <button onClick={handleReset} className="btn-primary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
