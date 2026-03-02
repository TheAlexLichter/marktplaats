import { Console, Effect } from "effect";
import { Args, Command } from "@effect/cli";
import { MarktplaatsClient } from "../services/MarktplaatsClient.js";
import { formatAsJson, formatListingList } from "../formatters/listing.js";
import type { Listing } from "../schemas/Listing.js";
import { BOLD, DIM, RESET } from "../colors.js";
import { catchApiErrors } from "../errors.js";
import { json } from "../options.js";

const itemId = Args.text({ name: "itemId" }).pipe(
  Args.withDescription("Item ID of a listing to find the seller's other listings"),
);

export const sellerCommand = Command.make("seller", { itemId, json }, (args) =>
  Effect.gen(function* () {
    const client = yield* MarktplaatsClient;

    // Step 1: Find the listing to get seller info
    yield* Console.log(`${DIM}Looking up listing ${args.itemId}...${RESET}`);

    const probe = yield* catchApiErrors(
      client.search({
        query: args.itemId,
        limit: 25,
      }),
    );

    const sourceListing = probe.listings.find((l) => l.itemId === args.itemId);
    if (!sourceListing) {
      yield* Console.error(`Listing "${args.itemId}" not found.`);
      return;
    }

    const sellerName = sourceListing.sellerInformation?.sellerName;
    const sellerId = sourceListing.sellerInformation?.sellerId;

    if (!sellerName && !sellerId) {
      yield* Console.error("Could not determine seller information.");
      return;
    }

    // Step 2: Search using the seller name and filter by seller ID
    yield* Console.log(`${DIM}Finding other listings by ${sellerName}...${RESET}`);

    const allFound: Listing[] = [];
    const seenIds = new Set<string>();

    // Search with seller name as query, scan multiple pages
    for (let page = 0; page < 3; page++) {
      const result = yield* client
        .search({
          query: sellerName ?? "",
          limit: 100,
          offset: page * 100,
          sortBy: "DATE",
          sortOrder: "DECREASING",
        })
        .pipe(
          Effect.catchAll(() => Effect.succeed({ listings: [] as Listing[], totalResultCount: 0 })),
        );

      for (const listing of result.listings) {
        if (listing.sellerInformation?.sellerId === sellerId && !seenIds.has(listing.itemId)) {
          allFound.push(listing);
          seenIds.add(listing.itemId);
        }
      }

      if (result.listings.length < 100) break;
    }

    if (allFound.length === 0) {
      yield* Console.log(`No other listings found from ${sellerName ?? "this seller"}.`);
      return;
    }

    if (args.json) {
      yield* Console.log(
        formatAsJson({
          seller: sellerName,
          sellerId,
          listings: allFound,
        }),
      );
    } else {
      yield* Console.log(`\n${BOLD}Listings by ${sellerName}${RESET}`);
      yield* Console.log(`${DIM}Seller ID: ${sellerId}${RESET}\n`);
      yield* Console.log(
        formatListingList(allFound, {
          page: 1,
          limit: allFound.length,
          totalResults: allFound.length,
        }),
      );
    }
  }),
);
