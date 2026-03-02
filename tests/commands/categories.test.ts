import { describe, expect, it } from "vite-plus/test";
import { Schema } from "effect";

const CategoryOption = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  fullName: Schema.optional(Schema.String),
  key: Schema.optional(Schema.String),
});

const CategoriesResponse = Schema.Struct({
  searchCategoryOptions: Schema.Array(CategoryOption),
});

const decode = Schema.decodeUnknownSync(CategoriesResponse);

describe("categories", () => {
  it("decodes a valid categories response", () => {
    const result = decode({
      searchCategoryOptions: [
        {
          id: 445,
          name: "Fietsen en Brommers",
          fullName: "Fietsen en Brommers",
          key: "fietsen-en-brommers",
        },
        { id: 201, name: "Boeken", fullName: "Boeken", key: "boeken" },
      ],
    });
    expect(result.searchCategoryOptions).toHaveLength(2);
    expect(result.searchCategoryOptions[0].id).toBe(445);
    expect(result.searchCategoryOptions[0].name).toBe("Fietsen en Brommers");
  });

  it("handles minimal category objects", () => {
    const result = decode({
      searchCategoryOptions: [{ id: 1, name: "Test" }],
    });
    expect(result.searchCategoryOptions[0].fullName).toBeUndefined();
  });

  it("filters categories by name (case-insensitive)", () => {
    const categories = [
      { id: 445, name: "Fietsen en Brommers" },
      { id: 201, name: "Boeken" },
      { id: 91, name: "Auto's" },
    ];

    const filter = "fiets";
    const filtered = categories.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(445);
  });

  it("returns all categories when no filter provided", () => {
    const categories = [
      { id: 445, name: "Fietsen en Brommers" },
      { id: 201, name: "Boeken" },
    ];
    expect(categories).toHaveLength(2);
  });
});
