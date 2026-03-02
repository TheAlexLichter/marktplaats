import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getConfigDir } from "./Config.js";

export interface SavedSearch {
  readonly name: string;
  readonly query: string;
  readonly limit?: number;
  readonly sort?: string;
  readonly sortOrder?: string;
  readonly postcode?: string;
  readonly distance?: number;
  readonly category?: number;
  readonly minPrice?: string;
  readonly maxPrice?: string;
}

function getSearchesPath(): string {
  return join(getConfigDir(), "searches.json");
}

export function readSavedSearches(): SavedSearch[] {
  try {
    return JSON.parse(readFileSync(getSearchesPath(), "utf-8")) as SavedSearch[];
  } catch {
    return [];
  }
}

export function writeSavedSearches(searches: SavedSearch[]): void {
  const dir = join(getSearchesPath(), "..");
  mkdirSync(dir, { recursive: true });
  writeFileSync(getSearchesPath(), JSON.stringify(searches, null, 2) + "\n");
}
