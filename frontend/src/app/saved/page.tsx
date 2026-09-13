"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Listing, api } from "../../lib/api";
import { ListingCard } from "../../components/ListingCard";
import { useAuth } from "../../lib/auth-context";
import { Heart, ArrowRight, LogIn, Trash2 } from "lucide-react";

export default function SavedPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSaved();
      setSavedListings(data.results || []);
    } catch (err) {
      setError((err as Error).message || "Failed to load saved listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchSaved();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleSaveToggle = (listingId: string, saved: boolean) => {
    if (!saved) {
      setSavedListings((prev) => prev.filter((l) => l.listing_id !== listingId));
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "48px 32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <Heart size={28} color="#fb7185" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
            Sign In to View Saved Properties
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
            Your saved properties are stored per user account and stay synchronized across reloads and re-logins.
          </p>
          <Link href="/login" className="btn-primary">
            <LogIn size={16} />
            <span>Sign In with Demo Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fb7185", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
          <Heart size={16} fill="currentColor" />
          <span>Personal Shortlist</span>
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Saved Properties
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "0.95rem" }}>
          Properties saved for account <strong style={{ color: "var(--text-primary)" }}>{user?.email}</strong>.
          Persists across page refreshes and re-logins.
        </p>
      </div>

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

      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px",
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel" style={{ height: "300px", opacity: 0.5 }} />
          ))}
        </div>
      )}

      {!loading && savedListings.length > 0 && (
        <div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px" }}>
            Total {savedListings.length} saved {savedListings.length === 1 ? "property" : "properties"}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px",
          }}>
            {savedListings.map((listing) => (
              <ListingCard
                key={listing.listing_id}
                listing={listing}
                isSavedInitial={true}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && savedListings.length === 0 && (
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
            <Heart size={26} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            No saved listings yet
          </h3>
          <p style={{ fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 20px" }}>
            Click the heart icon on any listing card to shortlist properties you are interested in.
          </p>
          <Link href="/listings" className="btn-primary">
            <span>Browse Listings</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
