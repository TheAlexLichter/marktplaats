import { describe, expect, it } from "vite-plus/test";
import {
  formatAsJson,
  formatListingDetail,
  formatListingList,
} from "../../src/formatters/listing.js";
import type { Listing } from "../../src/schemas/Listing.js";

const makeListing = (overrides: Partial<Listing> & { itemId: string }): Listing => ({
  ...overrides,
});

describe("formatListingList", () => {
  it("shows 'no results' message for empty listings", () => {
    const result = formatListingList([], { page: 1, limit: 25, totalResults: 0 });
    expect(result).toBe("Geen resultaten gevonden.");
  });

  it("formats a list of listings with numbering", () => {
    const listings = [
      makeListing({
        itemId: "m1",
        title: "Test Fiets",
        priceInfo: { priceCents: 15000, priceType: "FIXED" },
        location: { cityName: "Amsterdam" },
        date: "2025-01-15",
        vipUrl: "/v/fietsen/m1-test-fiets",
      }),
      makeListing({
        itemId: "m2",
        title: "Tweedehands Laptop",
        priceInfo: { priceCents: 25000, priceType: "FIXED" },
        location: { cityName: "Utrecht" },
      }),
    ];

    const result = formatListingList(listings, { page: 1, limit: 25, totalResults: 50 });
    expect(result).toContain("1.");
    expect(result).toContain("Test Fiets");
    expect(result).toContain("150.00");
    expect(result).toContain("Amsterdam");
    expect(result).toContain("2.");
    expect(result).toContain("Tweedehands Laptop");
    expect(result).toContain("250.00");
    expect(result).toContain("Page 1 of 2");
    expect(result).toContain("--page 2");
  });

  it("handles page 2 numbering correctly", () => {
    const listings = [makeListing({ itemId: "m1", title: "Item 26" })];

    const result = formatListingList(listings, { page: 2, limit: 25, totalResults: 30 });
    expect(result).toContain("26.");
    expect(result).toContain("Page 2 of 2");
    expect(result).not.toContain("--page 3");
  });

  it("shows free price for priceType FREE", () => {
    const listings = [
      makeListing({
        itemId: "m1",
        title: "Gratis item",
        priceInfo: { priceCents: 0, priceType: "FREE" },
      }),
    ];
    const result = formatListingList(listings, { page: 1, limit: 25, totalResults: 1 });
    expect(result).toContain("Gratis");
  });
});

describe("formatListingDetail", () => {
  it("formats a detailed listing", () => {
    const listing = makeListing({
      itemId: "m1",
      title: "Test Fiets",
      description: "Een hele mooie fiets in goede staat.",
      priceInfo: { priceCents: 15000, priceType: "FIXED" },
      location: { cityName: "Amsterdam" },
      date: "2025-01-15",
      sellerInformation: { sellerId: 1, sellerName: "Jan" },
      attributes: [{ key: "Merk", value: "Gazelle" }],
      imageUrls: ["https://example.com/img1.jpg"],
      vipUrl: "/v/fietsen/m1-test-fiets",
    });

    const result = formatListingDetail(listing);
    expect(result).toContain("Test Fiets");
    expect(result).toContain("150.00");
    expect(result).toContain("Een hele mooie fiets");
    expect(result).toContain("Amsterdam");
    expect(result).toContain("Jan");
    expect(result).toContain("Merk");
    expect(result).toContain("Gazelle");
    expect(result).toContain("img1.jpg");
    expect(result).toContain("marktplaats.nl");
  });
});

describe("relative Dutch date formatting", () => {
  it("converts 'Eergisteren' to an absolute date", () => {
    const listing = makeListing({
      itemId: "m1",
      title: "Test",
      date: "Eergisteren",
    });
    const result = formatListingDetail(listing);
    expect(result).not.toContain("Eergisteren");
    expect(result).toContain("Datum:");
  });

  it("converts 'Vandaag' to an absolute date", () => {
    const listing = makeListing({
      itemId: "m1",
      title: "Test",
      date: "Vandaag",
    });
    const result = formatListingDetail(listing);
    expect(result).not.toContain("Vandaag");
    expect(result).toContain("Datum:");
  });

  it("converts 'Gisteren' to an absolute date", () => {
    const listing = makeListing({
      itemId: "m1",
      title: "Test",
      date: "Gisteren",
    });
    const result = formatListingDetail(listing);
    expect(result).not.toContain("Gisteren");
    expect(result).toContain("Datum:");
  });
});

describe("formatAsJson", () => {
  it("returns enriched JSON for listings", () => {
    const data = { listings: [{ itemId: "m1" }] };
    const result = JSON.parse(formatAsJson(data));
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].id).toBe("m1");
    expect(result.listings[0].price).toBeDefined();
    expect(result.listings[0].location).toBeDefined();
    expect(result.listings[0].seller).toBeDefined();
    expect(result.listings[0].images).toEqual([]);
    expect(result.listings[0].attributes).toEqual({});
  });

  it("returns enriched JSON for a single listing", () => {
    const listing = makeListing({
      itemId: "m1",
      title: "Test",
      priceInfo: { priceCents: 15000, priceType: "FIXED" },
      vipUrl: "/v/test/m1-test",
    });
    const result = JSON.parse(formatAsJson(listing));
    expect(result.id).toBe("m1");
    expect(result.url).toBe("https://www.marktplaats.nl/v/test/m1-test");
    expect(result.price.eur).toBe(150);
    expect(result.price.cents).toBe(15000);
  });

  it("returns plain JSON for non-listing data", () => {
    const data = { foo: "bar" };
    const result = formatAsJson(data);
    expect(result).toBe(JSON.stringify(data, null, 2));
  });
});
