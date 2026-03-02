import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";
import { SearchResponse } from "../../src/schemas/SearchResponse.js";
import { Listing } from "../../src/schemas/Listing.js";

const decode = Schema.decodeUnknownSync(SearchResponse);
const decodeListing = Schema.decodeUnknownSync(Listing);

describe("SearchResponse schema", () => {
  it("decodes a minimal response", () => {
    const result = decode({
      listings: [],
    });
    expect(result.listings).toEqual([]);
    expect(result.totalResultCount).toBeUndefined();
  });

  it("decodes a full response", () => {
    const result = decode({
      listings: [
        {
          itemId: "m1234567890",
          title: "Test fiets",
          description: "Een mooie fiets",
          priceInfo: { priceCents: 15000, priceType: "FIXED" },
          location: { cityName: "Amsterdam", countryName: "Nederland" },
          sellerInformation: { sellerId: 123, sellerName: "TestSeller" },
          date: "2025-01-15",
          imageUrls: ["https://example.com/image.jpg"],
          vipUrl: "/v/fietsen/m1234567890-test-fiets",
          categoryId: 465,
        },
      ],
      totalResultCount: 42,
    });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].itemId).toBe("m1234567890");
    expect(result.listings[0].title).toBe("Test fiets");
    expect(result.listings[0].priceInfo?.priceCents).toBe(15000);
    expect(result.listings[0].location?.cityName).toBe("Amsterdam");
    expect(result.totalResultCount).toBe(42);
  });

  it("handles missing optional fields gracefully", () => {
    const result = decode({
      listings: [{ itemId: "m999" }],
    });
    expect(result.listings[0].itemId).toBe("m999");
    expect(result.listings[0].title).toBeUndefined();
    expect(result.listings[0].priceInfo).toBeUndefined();
    expect(result.listings[0].location).toBeUndefined();
  });

  it("rejects missing itemId", () => {
    expect(() => decode({ listings: [{}] })).toThrow();
  });
});

describe("Listing schema", () => {
  it("decodes attributes array", () => {
    const result = decodeListing({
      itemId: "m111",
      attributes: [
        { key: "condition", value: "Nieuw" },
        { key: "brand", value: "Gazelle" },
      ],
    });
    expect(result.attributes).toHaveLength(2);
    expect(result.attributes![0].key).toBe("condition");
  });

  it("ignores extra unknown fields", () => {
    const result = decodeListing({
      itemId: "m222",
      unknownField: "should be ignored",
      anotherUnknown: 123,
    });
    expect(result.itemId).toBe("m222");
  });
});
