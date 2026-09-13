import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.IVY_BASE_URL || "https://solve.ivy.homes";
const API_KEY = process.env.IVY_API_KEY || "IVY26-F87D4BF59BFD";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const url = new URL(req.url);
  const targetUrl = new URL(`${BASE_URL}/${path}`);

  // Forward query search parameters
  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {
    "X-API-Key": API_KEY,
  };

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const contentType = req.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await upstreamRes.text();
    const resHeaders = new Headers();
    resHeaders.set("Content-Type", upstreamRes.headers.get("Content-Type") || "application/json");

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Proxy server error", error: (error as Error).message },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const DELETE = proxyRequest;
export const PUT = proxyRequest;
