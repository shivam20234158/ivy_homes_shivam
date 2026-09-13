import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Ivy Homes — Chennai Real Estate Intelligence",
  description: "Browse verified residential properties, rentals, and builder projects in Chennai.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <footer style={{
              borderTop: "1px solid var(--border-subtle)",
              backgroundColor: "rgba(7, 9, 14, 0.95)",
              padding: "32px 24px",
              marginTop: "48px",
            }}>
              <div style={{
                maxWidth: "1280px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                    Ivy Homes · <span style={{ color: "#818cf8" }}>Chennai Region</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Verified property intelligence platform
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "right" }}>
                  <div>API Ref Version 1.4 · Reference: 10 Sep 2026 IST</div>
                  <div style={{ marginTop: "4px" }}>Assigned Locality: <strong style={{ color: "var(--text-primary)" }}>Guindy</strong></div>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
