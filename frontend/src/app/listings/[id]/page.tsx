"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Listing, api } from "../../../lib/api";
import { formatINR, formatArea, formatDate, capitalize } from "../../../lib/utils";
import { useAuth } from "../../../lib/auth-context";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Layers, 
  Compass, 
  Car, 
  ShieldCheck, 
  Heart, 
  ExternalLink, 
  Calendar, 
  Phone, 
  User, 
  Building2,
  Share2,
  CheckCircle2
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!listingId) return;

    setLoading(true);
    setError(null);

    // Fetch listing detail from GET /v1/listings/{id} (plural endpoint)
    api.getListingDetail(listingId)
      .then((data) => {
        setListing(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load listing details");
      })
      .finally(() => {
        setLoading(false);
      });

    // Check if saved
    if (isAuthenticated) {
      api.getSaved()
        .then((res) => {
          setIsSaved(res.results.some((l) => l.listing_id === listingId));
        })
        .catch(() => {});
    }
  }, [listingId, isAuthenticated]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await api.removeSaved(listingId);
        setIsSaved(false);
      } else {
        await api.saveListing(listingId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
        <div className="glass-panel" style={{ height: "450px", opacity: 0.6 }} />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "48px 24px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "12px", color: "#fb7185" }}>
            Listing Not Found
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            {error || "We could not find the property listing you requested."}
          </p>
          <Link href="/listings" className="btn-primary">
            <ArrowLeft size={16} /> Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const pricePerSqft = listing.carpet_area > 0 ? Math.round(listing.price / listing.carpet_area) : 0;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Back button */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/listings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            fontWeight: 500,
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Listings</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="glass-panel animate-fade-in" style={{ padding: "36px", marginBottom: "32px" }}>
        {/* Top Header Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              {listing.is_live ? (
                <span className="badge badge-live">● Active / Live</span>
              ) : (
                <span className="badge badge-inactive">● Inactive / Withdrawn</span>
              )}

              {listing.is_verified && (
                <span className="badge badge-verified">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}

              <span className="badge badge-tag">
                {capitalize(listing.property_type)}
              </span>

              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ID: {listing.listing_id}
              </span>
            </div>

            <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              {listing.apartment_name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", marginTop: "6px", fontSize: "1rem" }}>
              <MapPin size={17} color="#818cf8" />
              <span>{capitalize(listing.locality)}, Chennai · Portal: {listing.website}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{ padding: "10px 14px", fontSize: "0.85rem" }}
              title="Copy share link"
            >
              {copied ? <CheckCircle2 size={16} color="#34d399" /> : <Share2 size={16} />}
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>

            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className="btn-primary"
              style={{
                backgroundColor: isSaved ? "rgba(244, 63, 94, 0.2)" : undefined,
                border: isSaved ? "1px solid rgba(244, 63, 94, 0.4)" : undefined,
                color: isSaved ? "#fb7185" : "#ffffff",
                boxShadow: isSaved ? "none" : undefined,
              }}
            >
              <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
              <span>{isSaved ? "Saved" : "Save Listing"}</span>
            </button>
          </div>
        </div>

        {/* Pricing Banner */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: "20px 24px",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          marginBottom: "32px",
        }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Offering Price
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#34d399", letterSpacing: "-0.03em" }}>
              {formatINR(listing.price)}
            </div>
          </div>

          {pricePerSqft > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Price Rate
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                ₹{pricePerSqft.toLocaleString("en-IN")}<span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/sq ft</span>
              </div>
            </div>
          )}
        </div>

        {/* Key Specifications Grid */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
            Property Specifications
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}>
            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Bed size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bedrooms</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{listing.bedroom} BHK</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Bath size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bathrooms</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{listing.bathroom} Baths</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Maximize2 size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Carpet Area</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{formatArea(listing.carpet_area)}</div>
              </div>
            </div>

            {listing.super_built_up_area && (
              <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <Maximize2 size={22} color="#818cf8" />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Super Built-Up Area</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700 }}>{formatArea(listing.super_built_up_area)}</div>
                </div>
              </div>
            )}

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Layers size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Floor Level</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>Floor {listing.floor} of {listing.total_floors}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Compass size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Facing Direction</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, textTransform: "capitalize" }}>{listing.facing_direction || "Not specified"}</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Car size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Covered Parking</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{listing.covered_parking} Slots</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Building2 size={22} color="#818cf8" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Furnishing Status</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, textTransform: "capitalize" }}>{listing.furnishing}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)" }}>
              Seller Description
            </h2>
            <div style={{
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "var(--radius-sm)",
              padding: "20px",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
            }}>
              {listing.description}
            </div>
          </div>
        )}

        {/* Seller & Contact Information Card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "28px",
        }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)" }}>
              Contact & Seller Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <User size={16} color="#818cf8" />
                <span>{listing.posted_by_name} ({capitalize(listing.posted_by)})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <Phone size={16} color="#818cf8" />
                <span style={{ fontFamily: "var(--font-mono)" }}>{listing.posted_by_contact}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <Calendar size={16} color="#818cf8" />
                <span>Posted on {formatDate(listing.posted_at)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "14px", color: "var(--text-primary)" }}>
              Source & Verification
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              <div>Website Portal: <strong style={{ color: "var(--text-primary)" }}>{listing.website}</strong></div>
              {listing.project_id && (
                <div>
                  Associated Builder Project:{" "}
                  <Link href={`/projects`} style={{ color: "#818cf8", textDecoration: "underline" }}>
                    {listing.project_id}
                  </Link>
                </div>
              )}
              {listing.listing_url && (
                <div>
                  <a
                    href={listing.listing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#818cf8",
                      fontWeight: 600,
                    }}
                  >
                    <span>View original portal listing</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
