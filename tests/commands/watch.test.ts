import { describe, expect, it } from "vite-plus/test";
import type { Listing } from "../../src/schemas/Listing.js";

const makeListing = (overrides: Partial<Listing> & { itemId: string }): Listing => ({
  ...overrides,
});

describe("watch logic", () => {
  it("detects new listings by comparing seen IDs", () => {
    const seenIds = new Set(["m1", "m2"]);
    const listings = [
      makeListing({ itemId: "m1" }),
      makeListing({ itemId: "m3" }),
      makeListing({ itemId: "m4" }),
    ];

    const newListings = listings.filter((l) => !seenIds.has(l.itemId));
    expect(newListings).toHaveLength(2);
    expect(newListings[0].itemId).toBe("m3");
    expect(newListings[1].itemId).toBe("m4");
  });

  it("detects price changes", () => {
    const priceMap = new Map<string, number | undefined>([
      ["m1", 10000],
      ["m2", 20000],
    ]);

    const listings = [
      makeListing({ itemId: "m1", priceInfo: { priceCents: 8000 } }),
      makeListing({ itemId: "m2", priceInfo: { priceCents: 20000 } }),
    ];

    const changes = listings.filter((l) => {
      const oldPrice = priceMap.get(l.itemId);
      return oldPrice !== l.priceInfo?.priceCents;
    });

    expect(changes).toHaveLength(1);
    expect(changes[0].itemId).toBe("m1");
    expect(changes[0].priceInfo?.priceCents).toBe(8000);
  });

  it("tracks seen IDs after adding new listings", () => {
    const seenIds = new Set<string>();
    const batch1 = [makeListing({ itemId: "m1" }), makeListing({ itemId: "m2" })];
    const batch2 = [makeListing({ itemId: "m2" }), makeListing({ itemId: "m3" })];

    for (const l of batch1) seenIds.add(l.itemId);
    const newInBatch2 = batch2.filter((l) => !seenIds.has(l.itemId));
    for (const l of newInBatch2) seenIds.add(l.itemId);

    expect(seenIds.size).toBe(3);
    expect(newInBatch2).toHaveLength(1);
    expect(newInBatch2[0].itemId).toBe("m3");
  });

  it("handles price changing to undefined", () => {
    const priceMap = new Map<string, number | undefined>([["m1", 5000]]);
    const listing = makeListing({ itemId: "m1" }); // no priceInfo

    const oldPrice = priceMap.get("m1");
    const newPrice = listing.priceInfo?.priceCents;
    expect(oldPrice).toBe(5000);
    expect(newPrice).toBeUndefined();
    expect(oldPrice !== newPrice).toBe(true);
  });
});
