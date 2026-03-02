import { describe, expect, it } from "vite-plus/test";
import type { Listing } from "../../src/schemas/Listing.js";

const makeListing = (overrides: Partial<Listing> & { itemId: string }): Listing => ({
  ...overrides,
});

describe("seller filtering", () => {
  it("filters listings by numeric seller ID", () => {
    const listings = [
      makeListing({ itemId: "m1", sellerInformation: { sellerId: 123, sellerName: "Jan" } }),
      makeListing({ itemId: "m2", sellerInformation: { sellerId: 456, sellerName: "Piet" } }),
      makeListing({ itemId: "m3", sellerInformation: { sellerId: 123, sellerName: "Jan" } }),
    ];

    const targetId = 123;
    const filtered = listings.filter((l) => l.sellerInformation?.sellerId === targetId);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].itemId).toBe("m1");
    expect(filtered[1].itemId).toBe("m3");
  });

  it("filters listings by seller name (case-insensitive)", () => {
    const listings = [
      makeListing({ itemId: "m1", sellerInformation: { sellerId: 1, sellerName: "Jan" } }),
      makeListing({ itemId: "m2", sellerInformation: { sellerId: 2, sellerName: "Piet" } }),
      makeListing({ itemId: "m3", sellerInformation: { sellerId: 3, sellerName: "jan" } }),
    ];

    const target = "Jan";
    const filtered = listings.filter(
      (l) => l.sellerInformation?.sellerName?.toLowerCase() === target.toLowerCase(),
    );
    expect(filtered).toHaveLength(2);
  });

  it("detects numeric seller IDs", () => {
    expect(Number.isNaN(Number("12345"))).toBe(false);
    expect(Number.isNaN(Number("jan"))).toBe(true);
  });

  it("handles listings without seller information", () => {
    const listings = [
      makeListing({ itemId: "m1" }),
      makeListing({ itemId: "m2", sellerInformation: { sellerId: 123, sellerName: "Jan" } }),
    ];

    const filtered = listings.filter((l) => l.sellerInformation?.sellerId === 123);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].itemId).toBe("m2");
  });
});
