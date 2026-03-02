import { describe, expect, it } from "vite-plus/test";
import { buildSearchUrl } from "../../src/services/MarktplaatsClient.js";

describe("buildSearchUrl", () => {
  it("includes minPriceCents when provided", () => {
    const url = buildSearchUrl({ query: "fiets", minPriceCents: 1000 });
    expect(url).toContain("minPriceCents=1000");
  });

  it("includes maxPriceCents when provided", () => {
    const url = buildSearchUrl({ query: "fiets", maxPriceCents: 50000 });
    expect(url).toContain("maxPriceCents=50000");
  });

  it("includes both price filters", () => {
    const url = buildSearchUrl({ query: "fiets", minPriceCents: 1000, maxPriceCents: 50000 });
    expect(url).toContain("minPriceCents=1000");
    expect(url).toContain("maxPriceCents=50000");
  });

  it("omits price filters when undefined", () => {
    const url = buildSearchUrl({ query: "fiets" });
    expect(url).not.toContain("minPriceCents");
    expect(url).not.toContain("maxPriceCents");
  });

  it("builds base URL with query", () => {
    const url = buildSearchUrl({ query: "laptop" });
    expect(url).toContain("https://www.marktplaats.nl/lrp/api/search");
    expect(url).toContain("query=laptop");
  });

  it("includes all search params when provided", () => {
    const url = buildSearchUrl({
      query: "fiets",
      limit: 10,
      offset: 20,
      sortBy: "PRICE",
      sortOrder: "INCREASING",
      postcode: "1012AB",
      distanceMeters: 5000,
      l1CategoryId: 445,
    });
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=20");
    expect(url).toContain("sortBy=PRICE");
    expect(url).toContain("sortOrder=INCREASING");
    expect(url).toContain("postcode=1012AB");
    expect(url).toContain("distanceMeters=5000");
    expect(url).toContain("l1CategoryId=445");
  });
});
