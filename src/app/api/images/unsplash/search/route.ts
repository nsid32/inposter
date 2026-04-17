import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  user: { name: string; links: { html: string } };
  links: { download_location: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, page = 1 } = body as { query: string; page?: number };

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const accessKey = await getSetting("unsplash_access_key");
    if (!accessKey) {
      return NextResponse.json(
        { error: "Unsplash access key not configured" },
        { status: 400 }
      );
    }

    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "20");
    url.searchParams.set("orientation", "landscape");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (res.status === 401) {
      return NextResponse.json(
        { error: "Invalid Unsplash access key" },
        { status: 401 }
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Unsplash rate limit exceeded — try again later" },
        { status: 429 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Unsplash API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as UnsplashSearchResponse;

    const photos = (data.results ?? []).map((photo) => ({
      id: photo.id,
      thumb_url: photo.urls.small,
      full_url: photo.urls.regular,
      photographer_name: photo.user.name,
      photographer_link: photo.user.links.html,
      download_location: photo.links.download_location,
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Unsplash search error:", error);
    const message = error instanceof Error ? error.message : "Unsplash search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
