"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { 
  Building2, 
  Home, 
  KeyRound, 
  Heart, 
  BarChart3, 
  LogOut, 
  LogIn, 
  MapPin, 
  Sparkles,
  Menu,
  X
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [savedCount, setSavedCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Poll saved count on auth or route change
  useEffect(() => {
    if (!isAuthenticated) {
      setSavedCount(0);
      return;
    }
    let isMounted = true;
    api.getSaved()
      .then((data) => {
        if (isMounted) setSavedCount(data.count || 0);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, pathname]);

  const navItems = [
    { href: "/listings", label: "Listings", icon: Home },
    { href: "/rentals", label: "Rentals", icon: KeyRound },
    { href: "/projects", label: "Projects", icon: Building2 },
    { 
      href: "/saved", 
      label: "Saved", 
      icon: Heart, 
      badge: savedCount > 0 ? savedCount : null 
    },
    { 
      href: "/insights", 
      label: "Insights & Audit", 
      icon: BarChart3,
      glow: true 
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      backgroundColor: "rgba(7, 9, 14, 0.8)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 24px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Brand */}
        <Link href="/listings" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
          }}>
            <Building2 size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Ivy<span className="text-gradient">Homes</span>
              </span>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.7rem",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                fontWeight: 600,
              }}>
                <MapPin size={10} /> Chennai
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: "none", alignItems: "center", gap: "6px" }} className="desktop-nav">
          <style jsx>{`
            @media (min-width: 820px) {
              .desktop-nav { display: flex !important; }
              .mobile-toggle { display: none !important; }
            }
          `}</style>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.925rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                <Icon size={17} color={isActive ? "#818cf8" : "currentColor"} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontWeight: 700,
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.glow && (
                  <Sparkles size={13} color="#f59e0b" style={{ marginLeft: "-2px" }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Auth Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "none",
                flexDirection: "column",
                alignItems: "flex-end",
              }} className="user-email-display">
                <style jsx>{`
                  @media (min-width: 640px) {
                    .user-email-display { display: flex !important; }
                  }
                `}</style>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {user?.email}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--emerald-500)", fontWeight: 500 }}>
                  ● Session Active
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  transition: "all 0.15s ease",
                }}
                title="Sign out"
              >
                <LogOut size={15} />
                <span style={{ display: "none" }} className="logout-text">Sign out</span>
                <style jsx>{`
                  @media (min-width: 640px) {
                    .logout-text { display: inline !important; }
                  }
                `}</style>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.875rem" }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={18} color={isActive ? "#818cf8" : "currentColor"} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
