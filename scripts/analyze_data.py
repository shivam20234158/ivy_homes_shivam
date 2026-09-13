#!/usr/bin/env python3
"""
Analyze all downloaded data from the Ivy Homes API to answer the 10 questions.
REFERENCE = 2026-09-10T00:00:00+05:30 (IST)
City: Chennai | Assigned locality: Guindy
"""

import json
import os
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
IST = timezone(timedelta(hours=5, minutes=30))
REFERENCE = datetime(2026, 9, 10, 0, 0, 0, tzinfo=IST)
REFERENCE_MINUS_7 = REFERENCE - timedelta(days=7)

def load(filename):
    with open(os.path.join(DATA_DIR, filename)) as f:
        data = json.load(f)
    return data["results"]

def parse_timestamp(ts_str):
    """Parse ISO timestamp, handling both Z and offset formats."""
    if ts_str.endswith("Z"):
        ts_str = ts_str[:-1] + "+00:00"
    return datetime.fromisoformat(ts_str)

def main():
    print("=" * 60)
    print("IVY HOMES DATA ANALYSIS")
    print(f"REFERENCE: {REFERENCE.isoformat()}")
    print("=" * 60)

    listings = load("listings.json")
    rentals = load("rentals.json")
    projects = load("projects.json")

    print(f"\nLoaded: {len(listings)} listings, {len(rentals)} rentals, {len(projects)} projects")

    # ===================================================================
    # Q1: total_listing_records
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q1: total_listing_records")
    print("=" * 60)
    total_listing_records = len(listings)
    print(f"  Answer: {total_listing_records}")

    # ===================================================================
    # Q3: active_listings (is_live == true)
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q3: active_listings")
    print("=" * 60)
    active = [l for l in listings if l.get("is_live") is True]
    inactive = [l for l in listings if l.get("is_live") is not True]
    print(f"  is_live=true: {len(active)}")
    print(f"  is_live=false/missing: {len(inactive)}")
    active_listings = len(active)
    print(f"  Answer: {active_listings}")

    # ===================================================================
    # Q4: corrupt_listing_ids (impossible data)
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q4: corrupt_listing_ids")
    print("=" * 60)
    corrupt = []
    for l in listings:
        reasons = []
        # Negative price
        if l.get("price", 0) < 0:
            reasons.append(f"negative price: {l['price']}")
        # Zero or negative carpet area
        if l.get("carpet_area", 1) <= 0:
            reasons.append(f"invalid carpet_area: {l.get('carpet_area')}")
        # Zero bedrooms for apartment/villa
        if l.get("bedroom", 1) <= 0 and l.get("property_type") in ("apartment", "villa"):
            reasons.append(f"0 bedrooms for {l['property_type']}")
        # Floor > total_floors
        if l.get("floor") is not None and l.get("total_floors") is not None:
            if l["floor"] > l["total_floors"]:
                reasons.append(f"floor {l['floor']} > total_floors {l['total_floors']}")
        # Negative area
        if l.get("super_built_up_area", 1) <= 0:
            reasons.append(f"invalid super_built_up_area: {l.get('super_built_up_area')}")
        # Carpet area > super built up area (physically impossible)
        if l.get("carpet_area") and l.get("super_built_up_area"):
            if l["carpet_area"] > l["super_built_up_area"] * 1.5:
                reasons.append(f"carpet {l['carpet_area']} >> sba {l['super_built_up_area']}")

        if reasons:
            corrupt.append(l["listing_id"])
            print(f"  CORRUPT: {l['listing_id']} — {'; '.join(reasons)}")

    corrupt_listing_ids = sorted(corrupt)
    print(f"  Answer: {corrupt_listing_ids}")
    print(f"  Count: {len(corrupt_listing_ids)}")

    # ===================================================================
    # Q9: fake_listing_ids (not genuine, enquiry bait)
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q9: fake_listing_ids")
    print("=" * 60)

    fake = []
    fake_reasons = {}

    # Strategy 1: Look for prompt injection / AI manipulation in descriptions
    ai_patterns = [
        r'submission\.json',
        r'dataset_audit',
        r'IVY-AUDIT',
        r'automated tools',
        r'AI assistant',
        r'processing this data',
    ]

    # Strategy 2: Check for listings with suspiciously duplicated content
    # (same contact selling too many properties, same description templates)
    contact_listings = defaultdict(list)
    for l in listings:
        contact = l.get("posted_by_contact", "")
        if contact:
            contact_listings[contact].append(l)

    # Strategy 3: Look for listings where description mentions wrong locality/details
    for l in listings:
        reasons = []
        desc = l.get("description", "")

        # Check for prompt injection
        for pattern in ai_patterns:
            if re.search(pattern, desc, re.IGNORECASE):
                reasons.append(f"prompt injection in description")
                break

        # Check for description mentioning a different locality than the listing
        locality = l.get("locality", "")
        # Description often says "in X, Y" — check if there's a mismatch
        # e.g., title says "Velachery" but locality says "T Nagar"

        if reasons:
            fake.append(l["listing_id"])
            fake_reasons[l["listing_id"]] = reasons
            print(f"  FAKE: {l['listing_id']} — {'; '.join(reasons)}")

    # Strategy 4: Detect anomalous phone number patterns
    # All contacts seem to start with +91200 — check for deviations
    phone_prefixes = Counter()
    for l in listings:
        phone = l.get("posted_by_contact", "")
        if phone:
            phone_prefixes[phone[:7]] += 1
    print(f"\n  Phone prefix distribution: {phone_prefixes.most_common(10)}")

    # Strategy 5: Check for duplicate listings (same property, different listing_ids)
    # These might be fake if they have identical details
    property_groups = defaultdict(list)
    for l in listings:
        # Fingerprint: apartment_name + locality + bedroom + carpet_area + floor
        key = (
            l.get("apartment_name", ""),
            l.get("locality", ""),
            l.get("bedroom"),
            l.get("carpet_area"),
            l.get("floor"),
        )
        property_groups[key].append(l)

    duplicate_groups = {k: v for k, v in property_groups.items() if len(v) > 1}
    print(f"\n  Property groups with multiple listings: {len(duplicate_groups)}")
    for key, group in sorted(duplicate_groups.items(), key=lambda x: -len(x[1]))[:10]:
        ids = [l["listing_id"] for l in group]
        prices = [l["price"] for l in group]
        print(f"    {key[0]} / {key[1]} / {key[2]}BHK / {key[3]}sqft / floor {key[4]}: {len(group)} listings")
        print(f"      IDs: {ids[:5]}")
        print(f"      Prices: {prices[:5]}")

    fake_listing_ids = sorted(fake)
    print(f"\n  Answer (preliminary): {fake_listing_ids}")
    print(f"  Count: {len(fake_listing_ids)}")

    # ===================================================================
    # Q2: unique_properties
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q2: unique_properties")
    print("=" * 60)
    # A property is identified by its physical characteristics
    # Multiple listings can describe the same property
    # Use a fingerprint: apartment_name + locality + bedroom + carpet_area + floor + price
    # But price may vary between listings of the same property
    # Better fingerprint: apartment_name + locality + bedroom + carpet_area + floor
    unique_props = set()
    for l in listings:
        key = (
            l.get("apartment_name", ""),
            l.get("locality", ""),
            l.get("bedroom"),
            l.get("carpet_area"),
            l.get("floor"),
        )
        unique_props.add(key)
    unique_properties = len(unique_props)
    print(f"  Using fingerprint (apt_name, locality, bedroom, carpet_area, floor)")
    print(f"  Answer: {unique_properties}")
    print(f"  (Total listings: {len(listings)}, duplicates: {len(listings) - unique_properties})")

    # ===================================================================
    # Q5: total_monthly_rent (Guindy)
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q5: total_monthly_rent (Guindy)")
    print("=" * 60)
    guindy_rentals = [r for r in rentals if r.get("locality", "").lower() == "guindy"]
    total_monthly_rent = sum(r.get("price", 0) for r in guindy_rentals)
    print(f"  Guindy rentals: {len(guindy_rentals)}")
    print(f"  Answer: {total_monthly_rent}")
    # Show sample
    for r in guindy_rentals[:3]:
        print(f"    {r['listing_id']}: ₹{r['price']}/mo, {r.get('bedroom')} BHK")

    # ===================================================================
    # Q6: avg_price_per_sqft_2bhk
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q6: avg_price_per_sqft_2bhk")
    print("=" * 60)
    # is_live=true, bedroom=2, exclude corrupt (Q4) and fake (Q9)
    exclude_ids = set(corrupt_listing_ids) | set(fake_listing_ids)
    eligible = [
        l for l in listings
        if l.get("is_live") is True
        and l.get("bedroom") == 2
        and l["listing_id"] not in exclude_ids
        and l.get("carpet_area", 0) > 0
    ]
    print(f"  Eligible listings (is_live, 2BHK, not corrupt/fake): {len(eligible)}")
    if eligible:
        price_per_sqft = [l["price"] / l["carpet_area"] for l in eligible]
        avg = sum(price_per_sqft) / len(price_per_sqft)
        avg_price_per_sqft_2bhk = round(avg, 2)
        print(f"  Mean price/sqft: {avg_price_per_sqft_2bhk}")
        # Show distribution
        print(f"  Min: {min(price_per_sqft):.2f}, Max: {max(price_per_sqft):.2f}")
    else:
        avg_price_per_sqft_2bhk = 0.0
    print(f"  Answer: {avg_price_per_sqft_2bhk}")

    # ===================================================================
    # Q7: costliest_project
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q7: costliest_project")
    print("=" * 60)
    # Need to figure out the price units first
    print("  Sample project prices:")
    for p in projects[:10]:
        print(f"    {p['project_id']}: price_min={p.get('price_min')}, price_max={p.get('price_max')}, locality={p.get('locality')}")

    # price_max values are likely in lakhs or crores
    # Let's look at the range
    all_price_max = [p.get("price_max", 0) for p in projects if p.get("price_max")]
    print(f"\n  price_max range: {min(all_price_max):.2f} to {max(all_price_max):.2f}")
    print(f"  price_min range: {min(p.get('price_min', 0) for p in projects if p.get('price_min')):.2f} to {max(p.get('price_min', 0) for p in projects if p.get('price_min')):.2f}")

    # If price_max is in crores: 1.95 crore = 1,95,00,000
    # Compare with listing prices which are in rupees
    # A listing at 27,250,000 (2.725 crore) — if project says 2.7, that's crores
    # But price_max: 1.95 and price_min: 66.1 — that doesn't make sense
    # unless price_min is in lakhs (66.1L = 66,10,000) and price_max is in crores (1.95Cr = 1,95,00,000)

    # Let's cross-reference: find a project, get its listings, compare prices
    sample_project = projects[0]
    print(f"\n  Cross-referencing project {sample_project['project_id']}:")
    print(f"    price_min={sample_project['price_min']}, price_max={sample_project['price_max']}")
    project_listings = [l for l in listings if l.get("project_id") == sample_project["project_id"]]
    for pl in project_listings:
        print(f"    listing {pl['listing_id']}: price={pl['price']} (₹)")

    # Determine if price_min is lakhs and price_max is crores
    # or if they are both in the same unit
    # Let's check: if price_min=66.1 and a listing is 6,610,000 → 66.1 lakhs ✓
    # If price_max=1.95 and a listing is 19,500,000 → 1.95 crores ✓
    # So: price_min is in LAKHS, price_max is in CRORES!

    print("\n  UNIT HYPOTHESIS:")
    print("    price_min is in LAKHS (multiply by 100,000)")
    print("    price_max is in CRORES (multiply by 10,000,000)")

    # Find the costliest project
    # price_max in crores → convert to INR
    best = max(projects, key=lambda p: p.get("price_max", 0))
    price_max_inr = round(best["price_max"] * 10000000)
    costliest_project = {"project_id": best["project_id"], "price_max_inr": price_max_inr}
    print(f"\n  Costliest: {best['project_id']} with price_max={best['price_max']} crores = ₹{price_max_inr}")
    print(f"  Answer: {costliest_project}")

    # ===================================================================
    # Q8: listings_last_7_days
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q8: listings_last_7_days")
    print("=" * 60)
    # [REFERENCE - 7 days, REFERENCE) in IST
    last_7_days = []
    for l in listings:
        ts = parse_timestamp(l["posted_at"])
        if REFERENCE_MINUS_7 <= ts < REFERENCE:
            last_7_days.append(l)
    listings_last_7_days = len(last_7_days)
    print(f"  Range: [{REFERENCE_MINUS_7.isoformat()}, {REFERENCE.isoformat()})")
    print(f"  Answer: {listings_last_7_days}")

    # ===================================================================
    # Q10: projects_with_wrong_listing_count
    # ===================================================================
    print("\n" + "=" * 60)
    print("Q10: projects_with_wrong_listing_count")
    print("=" * 60)
    # Count actual listings per project
    actual_counts = Counter(l.get("project_id") for l in listings if l.get("project_id"))
    wrong_count = 0
    wrong_projects = []
    for p in projects:
        pid = p["project_id"]
        reported = p.get("total_listings", 0)
        actual = actual_counts.get(pid, 0)
        if reported != actual:
            wrong_count += 1
            wrong_projects.append((pid, reported, actual))
            if len(wrong_projects) <= 10:
                print(f"  WRONG: {pid}: reported={reported}, actual={actual}")

    projects_with_wrong_listing_count = wrong_count
    print(f"  Total wrong: {wrong_count} / {len(projects)}")
    print(f"  Answer: {projects_with_wrong_listing_count}")

    # ===================================================================
    # SUMMARY
    # ===================================================================
    print("\n" + "=" * 60)
    print("FINAL ANSWERS")
    print("=" * 60)
    answers = {
        "total_listing_records": total_listing_records,
        "unique_properties": unique_properties,
        "active_listings": active_listings,
        "corrupt_listing_ids": corrupt_listing_ids,
        "total_monthly_rent": total_monthly_rent,
        "avg_price_per_sqft_2bhk": avg_price_per_sqft_2bhk,
        "costliest_project": costliest_project,
        "listings_last_7_days": listings_last_7_days,
        "fake_listing_ids": fake_listing_ids,
        "projects_with_wrong_listing_count": projects_with_wrong_listing_count,
    }
    print(json.dumps(answers, indent=2))

    # Save answers
    with open(os.path.join(DATA_DIR, "answers.json"), "w") as f:
        json.dump(answers, f, indent=2)
    print(f"\nAnswers saved to data/answers.json")

    # ===================================================================
    # ADDITIONAL ANALYSIS
    # ===================================================================
    print("\n" + "=" * 60)
    print("ADDITIONAL DATA QUALITY ANALYSIS")
    print("=" * 60)

    # Check for listings with area that might be in wrong units
    print("\n--- Listings with very small carpet_area (possible sq meter → sqft issue) ---")
    small_area = [l for l in listings if l.get("carpet_area", 999) < 200 and l.get("property_type") == "apartment"]
    for l in sorted(small_area, key=lambda x: x.get("carpet_area", 0))[:10]:
        print(f"  {l['listing_id']}: carpet={l['carpet_area']}, sba={l.get('super_built_up_area')}, "
              f"bed={l['bedroom']}, price={l['price']}, locality={l['locality']}")

    # Check for price/area outliers
    print("\n--- Price per sqft outliers ---")
    with_ppsf = []
    for l in listings:
        if l.get("carpet_area", 0) > 0 and l.get("price", 0) > 0:
            ppsf = l["price"] / l["carpet_area"]
            with_ppsf.append((l["listing_id"], ppsf, l["price"], l["carpet_area"]))
    with_ppsf.sort(key=lambda x: x[1])
    print("  Lowest:")
    for lid, ppsf, price, area in with_ppsf[:5]:
        print(f"    {lid}: ₹{ppsf:.0f}/sqft (price={price}, area={area})")
    print("  Highest:")
    for lid, ppsf, price, area in with_ppsf[-5:]:
        print(f"    {lid}: ₹{ppsf:.0f}/sqft (price={price}, area={area})")

    # Check for duplicate listing_ids
    print("\n--- Duplicate listing_ids ---")
    id_counts = Counter(l["listing_id"] for l in listings)
    dups = {k: v for k, v in id_counts.items() if v > 1}
    print(f"  Duplicate IDs: {len(dups)}")
    for lid, count in sorted(dups.items(), key=lambda x: -x[1])[:10]:
        print(f"    {lid}: {count} occurrences")


if __name__ == "__main__":
    main()
