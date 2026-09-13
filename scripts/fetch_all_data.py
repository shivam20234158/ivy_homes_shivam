#!/usr/bin/env python3
"""
Fetch all data from the Ivy Homes API and save to JSON files.
Handles token refresh (15-min expiry) automatically.
"""

import json
import os
import sys
import time
import requests

BASE_URL = "https://solve.ivy.homes"
API_KEY = os.environ.get("IVY_API_KEY", "IVY26-F87D4BF59BFD")
PASSWORD = "3647126d48"
EMAIL = "demo1@ivy.homes"
LIMIT = 50  # Max allowed by API

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)


class IvyAPI:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers["X-API-Key"] = API_KEY
        self.access_token = None
        self.refresh_token = None
        self.token_expiry = 0

    def login(self):
        resp = self.session.post(f"{BASE_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD,
        })
        resp.raise_for_status()
        data = resp.json()
        self.access_token = data["access_token"]
        self.refresh_token = data["refresh_token"]
        self.token_expiry = time.time() + data["expires_in"] - 60  # 60s buffer
        self.session.headers["Authorization"] = f"Bearer {self.access_token}"
        print(f"  Logged in. Token expires in {data['expires_in']}s")

    def refresh(self):
        resp = self.session.post(f"{BASE_URL}/auth/refresh", json={
            "refresh_token": self.refresh_token,
        })
        resp.raise_for_status()
        data = resp.json()
        self.access_token = data["access_token"]
        self.refresh_token = data["refresh_token"]
        self.token_expiry = time.time() + data["expires_in"] - 60
        self.session.headers["Authorization"] = f"Bearer {self.access_token}"
        print(f"  Token refreshed.")

    def ensure_auth(self):
        if time.time() > self.token_expiry:
            if self.refresh_token:
                self.refresh()
            else:
                self.login()

    def fetch_all(self, endpoint, label="records"):
        """Fetch all records from a paginated endpoint using offset-based pagination."""
        all_results = []
        offset = 0

        # First request to get total
        self.ensure_auth()
        resp = self.session.get(f"{BASE_URL}{endpoint}", params={
            "limit": LIMIT,
            "offset": offset,
        })
        resp.raise_for_status()
        data = resp.json()
        total = data["total"]
        all_results.extend(data["results"])
        print(f"  {endpoint}: total={total}, fetched {len(all_results)}/{total}")

        while data["has_more"]:
            offset += LIMIT
            self.ensure_auth()
            resp = self.session.get(f"{BASE_URL}{endpoint}", params={
                "limit": LIMIT,
                "offset": offset,
            })
            resp.raise_for_status()
            data = resp.json()
            all_results.extend(data["results"])
            if len(all_results) % 500 < LIMIT:
                print(f"  {endpoint}: fetched {len(all_results)}/{total}")

        print(f"  {endpoint}: DONE — {len(all_results)} {label}")
        return all_results, total


def main():
    api = IvyAPI()
    print("=== Ivy Homes Data Fetcher ===\n")

    print("[1/4] Logging in...")
    api.login()

    print("\n[2/4] Fetching all listings...")
    listings, listings_total = api.fetch_all("/v1/listings", "listings")
    with open(os.path.join(DATA_DIR, "listings.json"), "w") as f:
        json.dump({"total": listings_total, "count": len(listings), "results": listings}, f, indent=2)
    print(f"  Saved {len(listings)} listings to data/listings.json")

    print("\n[3/4] Fetching all rentals...")
    rentals, rentals_total = api.fetch_all("/v1/rentals", "rentals")
    with open(os.path.join(DATA_DIR, "rentals.json"), "w") as f:
        json.dump({"total": rentals_total, "count": len(rentals), "results": rentals}, f, indent=2)
    print(f"  Saved {len(rentals)} rentals to data/rentals.json")

    print("\n[4/4] Fetching all projects...")
    projects, projects_total = api.fetch_all("/v1/projects", "projects")
    with open(os.path.join(DATA_DIR, "projects.json"), "w") as f:
        json.dump({"total": projects_total, "count": len(projects), "results": projects}, f, indent=2)
    print(f"  Saved {len(projects)} projects to data/projects.json")

    print(f"\n=== Summary ===")
    print(f"  Listings: {len(listings)} (API total: {listings_total})")
    print(f"  Rentals:  {len(rentals)} (API total: {rentals_total})")
    print(f"  Projects: {len(projects)} (API total: {projects_total})")
    print(f"\nAll data saved to {os.path.abspath(DATA_DIR)}/")


if __name__ == "__main__":
    main()
