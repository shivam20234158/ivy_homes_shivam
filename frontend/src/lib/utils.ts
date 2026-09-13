// Utility functions for formatting real estate data

export function formatINR(amount: number): string {
  if (amount == null || isNaN(amount)) return "₹0";
  if (amount < 0) return `-₹${Math.abs(amount).toLocaleString("en-IN")}`;

  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatRent(amount: number): string {
  if (amount == null || isNaN(amount)) return "₹0/mo";
  return `₹${amount.toLocaleString("en-IN")}/mo`;
}

/**
 * Projects API returns prices where:
 * - values < 10 are in CRORES (e.g. 1.95 Cr, 3.78 Cr)
 * - values >= 10 are in LAKHS (e.g. 66.1 L, 99.8 L)
 */
export function projectPriceToINR(val: number | null | undefined): number {
  if (val == null || isNaN(val)) return 0;
  if (val < 10) {
    return Math.round(val * 10000000);
  }
  return Math.round(val * 100000);
}

export function formatProjectPriceRange(minPrice: number, maxPrice: number): string {
  const minINR = projectPriceToINR(minPrice);
  const maxINR = projectPriceToINR(maxPrice);
  if (!minINR && !maxINR) return "Price on Request";
  if (minINR && !maxINR) return `From ${formatINR(minINR)}`;
  if (!minINR && maxINR) return `Up to ${formatINR(maxINR)}`;
  return `${formatINR(minINR)} - ${formatINR(maxINR)}`;
}

export function formatArea(sqft: number | null | undefined): string {
  if (sqft == null || isNaN(sqft)) return "N/A";
  return `${sqft.toLocaleString("en-IN")} sq ft`;
}

export function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return "N/A";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}

export function capitalize(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
