import { createInterface } from "node:readline";
import type { Listing } from "./schemas/Listing.js";
import { formatListingDetail, formatPrice } from "./formatters/listing.js";
import { BOLD, CLEAR_SCREEN, DIM, INVERT, RESET } from "./colors.js";
import { openInBrowser } from "./browser.js";

function renderList(
  listings: readonly Listing[],
  selected: number,
  page: number,
  totalResults: number,
  limit: number,
): string {
  const lines: string[] = [];
  const startIndex = (page - 1) * limit;

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const num = startIndex + i + 1;
    const title = listing.title ?? "Geen titel";
    const price = formatPrice(listing);
    const location = listing.location?.cityName ?? "";
    const prefix = i === selected ? `${INVERT}` : "";
    const suffix = i === selected ? `${RESET}` : "";

    lines.push(`${prefix}${BOLD}${num}.${RESET}${prefix} ${BOLD}${title}${RESET}${suffix}`);
    lines.push(`${prefix}   ${price}  ${location}${suffix}`);
    lines.push("");
  }

  const totalPages = Math.ceil(totalResults / limit);
  lines.push("");
  lines.push(`${DIM}Page ${page} of ${totalPages} (${totalResults} results)${RESET}`);
  lines.push(`${DIM}↑/↓ navigate  Enter view  o open  n/p next/prev page  q quit${RESET}`);

  return lines.join("\n");
}

export interface TuiOptions {
  listings: readonly Listing[];
  page: number;
  limit: number;
  totalResults: number;
  onPageChange?: (page: number) => Promise<{ listings: readonly Listing[]; totalResults: number }>;
}

export function startTui(options: TuiOptions): Promise<void> {
  return new Promise((resolve) => {
    let { listings } = options;
    let { page, totalResults } = options;
    const { limit } = options;
    let selected = 0;
    let detailMode = false;
    let detailContent = "";

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    function render() {
      process.stdout.write(CLEAR_SCREEN);
      if (detailMode) {
        process.stdout.write(detailContent + "\n\n");
        process.stdout.write(`${DIM}Esc/Backspace back  o open in browser  q quit${RESET}\n`);
      } else {
        process.stdout.write(renderList(listings, selected, page, totalResults, limit) + "\n");
      }
    }

    function openListingInBrowser(listing: Listing) {
      if (!listing.vipUrl) return;
      openInBrowser(`https://www.marktplaats.nl${listing.vipUrl}`);
    }

    function cleanup() {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      rl.close();
      process.stdout.write(CLEAR_SCREEN);
      resolve();
    }

    render();

    process.stdin.on("data", async (data) => {
      const key = data.toString();

      if (key === "q" || key === "\x03") {
        // q or Ctrl+C
        cleanup();
        return;
      }

      if (detailMode) {
        if (key === "\x1b" || key === "\x7f" || key === "\b") {
          // Esc or Backspace
          detailMode = false;
          render();
          return;
        }
        if (key === "o") {
          openListingInBrowser(listings[selected]);
          return;
        }
        return;
      }

      // Arrow keys
      if (key === "\x1b[A") {
        // Up
        selected = Math.max(0, selected - 1);
        render();
      } else if (key === "\x1b[B") {
        // Down
        selected = Math.min(listings.length - 1, selected + 1);
        render();
      } else if (key === "\r" || key === "\n") {
        // Enter
        const listing = listings[selected];
        detailContent = formatListingDetail(listing);
        detailMode = true;
        render();
      } else if (key === "o") {
        openListingInBrowser(listings[selected]);
      } else if (key === "n") {
        const totalPages = Math.ceil(totalResults / limit);
        if (page < totalPages && options.onPageChange) {
          page++;
          const result = await options.onPageChange(page);
          listings = result.listings;
          totalResults = result.totalResults;
          selected = 0;
          render();
        }
      } else if (key === "p") {
        if (page > 1 && options.onPageChange) {
          page--;
          const result = await options.onPageChange(page);
          listings = result.listings;
          totalResults = result.totalResults;
          selected = 0;
          render();
        }
      }
    });
  });
}
