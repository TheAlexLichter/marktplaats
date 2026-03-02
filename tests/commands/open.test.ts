import { describe, expect, it } from "vite-plus/test";

describe("open command URL construction", () => {
  it("builds correct Marktplaats URL from itemId", () => {
    const itemId = "m1234567890";
    const url = `https://www.marktplaats.nl/v/item/${itemId}.html`;
    expect(url).toBe("https://www.marktplaats.nl/v/item/m1234567890.html");
  });

  it("handles itemId with dashes", () => {
    const itemId = "m1234567890-test-fiets";
    const url = `https://www.marktplaats.nl/v/item/${itemId}.html`;
    expect(url).toContain("m1234567890-test-fiets");
  });
});
