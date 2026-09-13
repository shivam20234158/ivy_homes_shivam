"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Listing, api } from "../lib/api";
import { formatINR, formatArea, capitalize } from "../lib/utils";
import { useAuth } from "../lib/auth-context";
import { 
  MapPin, 
  Bed, 
  Layers, 
  Maximize2, 
  Heart, 
  ShieldCheck, 
  ExternalLink,
  Calendar
} from "lucide-react";

interface ListingCardProps {
  listing: Listing;
  isSavedInitial?: boolean;
  onSaveToggle?: (listingId: string, saved: boolean) => void;
}

export function ListingCard({ listing, isSavedInitial = false, onSaveToggle }: ListingCardProps) {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(isSavedInitial);
  const [saving, setSaving] = useState(false);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        await api.removeSaved(listing.listing_id);
        setSaved(false);
        onSaveToggle?.(listing.listing_id, false);
      } else {
        await api.saveListing(listing.listing_id);
        setSaved(true);
        onSaveToggle?.(listing.listing_id, true);
      }
    } catch (err) {
      console.error("Save toggle error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="glass-panel animate-fade-in" 
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "var(--radius-md)",
        padding: "20px",
        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s, box-shadow 0.2s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "var(--border-glow)";
        e.currentTarget.style.boxShadow = "var(--shadow-glow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
    >
      {/* Top row: Badges and Save button */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {listing.is_live ? (
              <span className="badge badge-live">● Live</span>
            ) : (
              <span className="badge badge-inactive">● Inactive</span>
            )}

            {listing.is_verified && (
              <span className="badge badge-verified" title="Verified by Operations">
                <ShieldCheck size={11} /> Verified
              </span>
            )}

            <span className="badge badge-tag">
              {capitalize(listing.property_type)}
            </span>
          </div>

          <button
            onClick={handleHeartClick}
            disabled={saving}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: saved ? "rgba(244, 63, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
              border: saved ? "1px solid rgba(244, 63, 94, 0.4)" : "1px solid var(--border-subtle)",
              color: saved ? "#fb7185" : "var(--text-muted)",
              transition: "all 0.15s ease",
            }}
            title={saved ? "Remove from saved" : "Save listing"}
          >
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Title and Locality */}
        <Link href={`/listings/${listing.listing_id}`}>
          <h3 style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            lineHeight: 1.35,
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}>
            {listing.apartment_name}
          </h3>
        </Link>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: "16px",
        }}>
          <MapPin size={14} color="#818cf8" />
          <span>{capitalize(listing.locality)}, Chennai</span>
        </div>

        {/* Specs Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          padding: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          marginBottom: "18px",
          fontSize: "0.85rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Bed size={15} color="#818cf8" />
            <span><strong>{listing.bedroom}</strong> BHK</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Maximize2 size={15} color="#818cf8" />
            <span>{formatArea(listing.carpet_area)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
            <Layers size={15} color="#818cf8" />
            <span>Floor {listing.floor}/{listing.total_floors}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
            <span>{listing.furnishing}</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Price and Detail link */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid var(--border-subtle)",
        paddingTop: "16px",
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
            Asking Price
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>
            {formatINR(listing.price)}
          </div>
        </div>

        <Link
          href={`/listings/${listing.listing_id}`}
          className="btn-secondary"
          style={{ padding: "8px 14px", fontSize: "0.85rem" }}
        >
          <span>View Details</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
