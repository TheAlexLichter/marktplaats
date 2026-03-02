import { describe, expect, it, beforeEach, afterEach } from "vite-plus/test";
import { readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { SavedSearch } from "../../src/services/SavedSearches.js";

function makeTestStore(dir: string) {
  const path = join(dir, "searches.json");

  function read(): SavedSearch[] {
    try {
      return JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      return [];
    }
  }

  function write(searches: SavedSearch[]): void {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, JSON.stringify(searches, null, 2) + "\n");
  }

  return { read, write };
}

describe("saved searches", () => {
  let testDir: string;
  let store: ReturnType<typeof makeTestStore>;

  beforeEach(() => {
    testDir = join(tmpdir(), `marktplaats-saved-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    store = makeTestStore(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns empty array when no file exists", () => {
    expect(store.read()).toEqual([]);
  });

  it("saves and reads a search", () => {
    store.write([{ name: "bikes", query: "fiets", postcode: "1012AB" }]);
    const searches = store.read();
    expect(searches).toHaveLength(1);
    expect(searches[0].name).toBe("bikes");
    expect(searches[0].query).toBe("fiets");
    expect(searches[0].postcode).toBe("1012AB");
  });

  it("supports multiple saved searches", () => {
    store.write([
      { name: "bikes", query: "fiets" },
      { name: "laptops", query: "laptop", minPrice: "100", maxPrice: "500" },
    ]);
    const searches = store.read();
    expect(searches).toHaveLength(2);
    expect(searches[1].minPrice).toBe("100");
  });

  it("can remove a search by filtering", () => {
    store.write([
      { name: "bikes", query: "fiets" },
      { name: "laptops", query: "laptop" },
    ]);
    const filtered = store.read().filter((s) => s.name !== "bikes");
    store.write(filtered);
    expect(store.read()).toHaveLength(1);
    expect(store.read()[0].name).toBe("laptops");
  });

  it("can update an existing search", () => {
    store.write([{ name: "bikes", query: "fiets" }]);
    const searches = store.read();
    searches[0] = { ...searches[0], query: "racefiets" };
    store.write(searches);
    expect(store.read()[0].query).toBe("racefiets");
  });
});
