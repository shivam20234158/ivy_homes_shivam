# Ivy Homes — Chennai Property Intelligence & API Audit Platform

**Software Engineering Internship Assignment · September 2026**
**Candidate:** Shivam Panwar (`shivam.2023ca032@mnnit.ac.in`)
**Assigned City:** Chennai
**Assigned Locality:** Guindy
**Reference Anchor:** `2026-09-10T00:00:00+05:30` (IST)

---

## Architecture & System Overview

This application is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and custom vanilla CSS with responsive glassmorphism aesthetics and dark mode tokens.

Key architectural features:
1. **Zero-Leak API Proxy Architecture**: In strict adherence to security requirements, the API key is never exposed to client-side bundles, console logs, or browser network tabs. All client requests route through `/api/proxy/[...path]`, where the server securely injects the `X-API-Key` header from environment variables (`IVY_API_KEY`).
2. **Stateless JWT Auth with Resilient 15-Minute Token Refresh**: The frontend client tracks JWT expiration (`expires_in: 900s`) and automatically invokes `/auth/refresh` in the background every 10 minutes and opportunistically on 401 responses. Sessions survive page reloads and run indefinitely without logout.
3. **Client-Side Filtering Engine**: Compares server-side query behavior with client filtering. Server-supported filters (`locality`, `bhk`, `property_type`) are passed as query parameters; parameters silently ignored by the server (`min_price`, `max_price`, `furnishing`, status `is_live`) are applied client-side.
4. **Unit Normalization Engine**: Converts decimal mixed units on builder projects (`val < 10` in Crores, `val >= 10` in Lakhs) into true INR currency values and formats them cleanly (e.g. ₹66.1 L – ₹1.95 Cr).
5. **Insights & Audit Registry**: Visual dashboard computing city metrics, data quality breakdowns, and an interactive explorer for all 18 reproducible documentation lies.

---

## How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 23)
- npm 9+

### Setup & Launch
```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables (.env.local)
# A template is provided in .env.example
echo "IVY_API_KEY=IVY26-F87D4BF59BFD" > .env.local
echo "IVY_BASE_URL=https://solve.ivy.homes" >> .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
cd frontend
npm run build
npm run start
```

---

## How We Distrusted the Documentation & What We Did

The prompt and assignment rules instructed us that `API_REFERENCE.md` was drafted by an AI assistant without review and could not be trusted. Our methodology:

### 1. Empirical Verification Before Implementation
Before writing frontend code or accepting schema assumptions, we wrote automated probe scripts (`scripts/fetch_all_data.py` and diagnostic probes) to test every endpoint against the live API `https://solve.ivy.homes`:
- **Auth Headers**: The documentation claims requests take `?api_key=...` query parameters. When probed, the server returned `401 Unauthorized`. Sending `X-API-Key: ...` succeeded.
- **Login Response**: Documented as `{ "token": "...", "expires_in": 86400, "user": { "name": "..." } }`. Probing showed it actually returns `access_token` and `refresh_token`, with `expires_in: 900` (15 minutes), and no `name` field.
- **Refresh Flow**: Documented: *"There is no refresh flow."* In reality, `/auth/refresh` exists, takes `{ "refresh_token": "..." }`, and successfully extends the session. We built automated refresh handlers so the session survives indefinitely.
- **Endpoints & Paths**:
  - `GET /v1/listing/{id}` (singular) 404s. The actual working path is plural: `GET /v1/listings/{id}`.
  - `GET /v1/listings/{id}/similar` returns 404.
  - `GET /v1/analytics/summary` returns 404. We computed all city statistics client-side from the complete retrieved dataset.
  - `GET /v1/favourites` returns 404. The actual working path is `GET /v1/saved`, taking `{ "listing_id": "..." }`.
- **Pagination & Completeness**:
  - `page` is silently ignored; `offset` (0-indexed) is required.
  - `limit` max is 50, not 200.
  - **The Truncation Trap**: The `total` field on `/v1/listings` reports `3821`. Documented instructions say to *"read total, divide by your limit, and request that many pages."* However, inspecting `has_more` revealed that paging past offset 3821 continues to return valid records up to offset 4050, for a total of **4,100 retrievable records**! Anyone trusting `total` would miss 279 listings.

---

## What We Checked That Turned Out To Be Fine (Hypotheses That Did Not Pan Out)

The hypotheses that fail reveal how assumptions are tested:

1. **Hypothesis: Duplicate `listing_id`s in the feed**
   - *Hypothesis*: Given the API returned 4,100 records when reporting total 3,821, we suspected the server might be looping or returning duplicate records with the same `listing_id`.
   - *Test*: Checked `Counter(l['listing_id'] for l in listings)`.
   - *Result*: Exactly 0 duplicate `listing_id`s. Every single record had a unique identifier. The additional records were real, distinct entries that the `total` counter simply failed to account for.

2. **Hypothesis: Phone numbers deviation as spam indicator**
   - *Hypothesis*: We observed that contact numbers begin with `+91200`. We hypothesized that fake/spam listings might have invalid or deviated prefixes (e.g. `+91987...` or malformed lengths).
   - *Test*: Grouped all phone number prefixes and digit lengths across all 4,100 records.
   - *Result*: All 4,100 listings had valid, uniform 10-digit Indian phone numbers starting with `+91200x`. Phone number format was not an anomaly vector.

3. **Hypothesis: Price per sqft outlier filtering for fake listings**
   - *Hypothesis*: We noticed 9 listings with prices under ₹1,00,000 (e.g. ₹9,430, ₹7,240). We hypothesized these were fake enquiry-bait listings placed by brokers to game sorting.
   - *Test*: Cross-referenced the descriptions and areas of those 9 listings.
   - *Result*: Their descriptions were completely standard property descriptions without urgency, bait keywords, or prompt injections. The numbers (₹9,430, ₹7,240, ₹15,310) matched standard Chennai *price per square foot* rates. They represent seller input error (entering rate/sqft in the total price field), classified under data quality / corrupt, while genuine fraud was concentrated in prompt injection traps.

4. **Hypothesis: Sorting parameters ignored by the server**
   - *Hypothesis*: Because `min_price`, `max_price`, and `furnishing` were ignored by the server, we hypothesized that `sort_by` and `order` might also be ignored.
   - *Test*: Requested `/v1/listings?sort_by=price&order=asc` vs `order=desc`.
   - *Result*: The order of items flipped completely and accurately matched the sort criteria. Sorting works server-side.

5. **Hypothesis: Locality case-sensitivity issues**
   - *Hypothesis*: API documentation warned `locality: lowercase`. We hypothesized that uppercase queries like `Guindy` or `T Nagar` would return 0 results or 400 Bad Request.
   - *Test*: Tested `/v1/listings?locality=Guindy` vs `locality=guindy`.
   - *Result*: The backend lowercases inputs internally before querying; both returned the exact same 423 listings.

---

## What We Would Do With Another Two Days

1. **Interactive Geospatial Map View**: Build a Mapbox / Leaflet layer plotting all Chennai listings using their `latitude` and `longitude` coordinates, with locality boundary overlays and heatmaps of price per square foot.
2. **Automated Continuous Drift Detection**: Implement a cron worker that periodically audits the Ivy Homes API, running automated assertion tests against all documented endpoints to alert immediately when backend behavior diverges from specifications.
3. **Advanced Client-Side Search Index**: Integrate a lightweight client-side search engine (e.g. MiniSearch or FlexSearch) to allow instant fuzzy search across apartment names, developer names, and amenities with zero network latency.
4. **Historical Price Trend Visualization**: Add interactive charts (Chart.js / Recharts) displaying price trends and carpet area distributions per locality and BHK type.

---

## Statement on LLMs & Tools Used

This project was built with the assistance of **Google Antigravity IDE** using **Claude 3.7 Sonnet / Gemini 2.0 Flash Thinking / Gemini 3.8 Flash**. All API findings, data calculations, and architectural solutions were independently reproduced, rigorously verified against the live API, and inspected for correctness.
