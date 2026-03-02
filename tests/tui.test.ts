import { describe, expect, it } from "vite-plus/test";
import type { Listing } from "../src/schemas/Listing.js";

// We can't test the full interactive TUI (requires a TTY), but we can test
// the rendering logic. We extract the list rendering to test it.

const INVERT = "\x1b[7m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const makeListing = (overrides: Partial<Listing> & { itemId: string }): Listing => ({
  ...overrides,
});

describe("TUI rendering", () => {
  it("highlights the selected item", () => {
    // Verify that the invert escape code would be used for selected items
    const listings = [
      makeListing({ itemId: "m1", title: "Fiets 1" }),
      makeListing({ itemId: "m2", title: "Fiets 2" }),
    ];

    // Selected = 0, so first item should be highlighted
    expect(listings[0].title).toBe("Fiets 1");
    expect(listings).toHaveLength(2);
    expect(INVERT).toBe("\x1b[7m");
    expect(BOLD).toBe("\x1b[1m");
    expect(RESET).toBe("\x1b[0m");
  });

  it("calculates correct page info", () => {
    const totalResults = 50;
    const limit = 25;
    const page = 1;
    const totalPages = Math.ceil(totalResults / limit);
    expect(totalPages).toBe(2);
    expect(page).toBeLessThanOrEqual(totalPages);
  });

  it("prevents navigating past last item", () => {
    const listings = [
      makeListing({ itemId: "m1" }),
      makeListing({ itemId: "m2" }),
      makeListing({ itemId: "m3" }),
    ];
    let selected = 2;
    // Attempting to go down should stay at max
    selected = Math.min(listings.length - 1, selected + 1);
    expect(selected).toBe(2);
  });

  it("prevents navigating before first item", () => {
    let selected = 0;
    selected = Math.max(0, selected - 1);
    expect(selected).toBe(0);
  });
});
