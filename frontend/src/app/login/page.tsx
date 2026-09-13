"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("3647126d48");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, allow redirecting
  if (isAuthenticated) {
    router.push("/listings");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/listings");
    } catch (err) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("3647126d48");
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, "3647126d48");
      router.push("/listings");
    } catch (err) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 180px)",
      padding: "24px",
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: "460px",
        width: "100%",
        padding: "40px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          top: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "100px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "var(--accent-gradient)",
            boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)",
            marginBottom: "16px",
          }}>
            <Building2 size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Welcome to <span className="text-gradient">Ivy Homes</span>
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "8px" }}>
            Sign in to explore verified Chennai property data
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "12px" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo1@ivy.homes"
                className="input-control"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "12px" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="input-control"
                style={{ paddingLeft: "42px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "4px" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Demo Account Quick Pick */}
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 700,
          }}>
            <ShieldCheck size={14} color="#818cf8" />
            <span>Quick Demo Logins</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {["demo1", "demo2", "demo3"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleQuickLogin(`${d}@ivy.homes`)}
                disabled={loading}
                className="btn-secondary"
                style={{
                  padding: "8px",
                  fontSize: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <User size={15} color="#818cf8" />
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
