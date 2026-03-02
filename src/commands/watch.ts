import { Console, Effect, Option } from "effect";
import { Args, Command, Options } from "@effect/cli";
import { MarktplaatsClient } from "../services/MarktplaatsClient.js";
import type { Listing } from "../schemas/Listing.js";
import { BOLD, CYAN, DIM, RESET, YELLOW } from "../colors.js";
import { formatPrice } from "../formatters/listing.js";
import { eurosToCents } from "../utils.js";
import { postcode, distance, category, minPrice, maxPrice } from "../options.js";

const query = Args.text({ name: "query" });

const interval = Options.integer("interval").pipe(
  Options.withAlias("n"),
  Options.withDescription("Check interval in seconds"),
  Options.withDefault(60),
);

const limit = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDescription("Number of results to check"),
  Options.withDefault(25),
);

function formatTimestamp(): string {
  return new Date().toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const watchCommand = Command.make(
  "watch",
  { query, interval, limit, postcode, distance, category, minPrice, maxPrice },
  (args) =>
    Effect.gen(function* () {
      const client = yield* MarktplaatsClient;

      const searchParams = {
        query: args.query,
        limit: args.limit,
        sortBy: "DATE" as const,
        sortOrder: "DECREASING" as const,
        postcode: Option.getOrUndefined(args.postcode),
        distanceMeters: Option.getOrUndefined(args.distance),
        l1CategoryId: Option.getOrUndefined(args.category),
        minPriceCents: Option.map(args.minPrice, eurosToCents).pipe(Option.getOrUndefined),
        maxPriceCents: Option.map(args.maxPrice, eurosToCents).pipe(Option.getOrUndefined),
      };

      yield* Console.log(`${BOLD}Watching "${args.query}" every ${args.interval}s${RESET}`);
      yield* Console.log(`${DIM}Press Ctrl+C to stop${RESET}\n`);

      const seenIds = new Set<string>();
      const priceMap = new Map<string, number | undefined>();

      // Initial fetch to establish baseline
      const initial = yield* client
        .search(searchParams)
        .pipe(
          Effect.catchAll(() => Effect.succeed({ listings: [] as Listing[], totalResultCount: 0 })),
        );

      for (const listing of initial.listings) {
        seenIds.add(listing.itemId);
        priceMap.set(listing.itemId, listing.priceInfo?.priceCents);
      }

      yield* Console.log(
        `${DIM}[${formatTimestamp()}] Tracking ${seenIds.size} listings. Watching for changes...${RESET}\n`,
      );

      // Poll loop
      yield* Effect.async<never, never>((_resume) => {
        const timer = setInterval(async () => {
          try {
            const result = await Effect.runPromise(
              client
                .search(searchParams)
                .pipe(
                  Effect.catchAll(() =>
                    Effect.succeed({ listings: [] as Listing[], totalResultCount: 0 }),
                  ),
                ),
            );

            const newListings: Listing[] = [];
            const priceChanges: {
              listing: Listing;
              oldPrice: number | undefined;
              newPrice: number | undefined;
            }[] = [];

            for (const listing of result.listings) {
              if (!seenIds.has(listing.itemId)) {
                newListings.push(listing);
                seenIds.add(listing.itemId);
                priceMap.set(listing.itemId, listing.priceInfo?.priceCents);
              } else {
                const oldPrice = priceMap.get(listing.itemId);
                const newPrice = listing.priceInfo?.priceCents;
                if (oldPrice !== newPrice) {
                  priceChanges.push({ listing, oldPrice, newPrice });
                  priceMap.set(listing.itemId, newPrice);
                }
              }
            }

            if (newListings.length > 0) {
              console.log(
                `${CYAN}[${formatTimestamp()}] ${newListings.length} new listing(s):${RESET}`,
              );
              for (const listing of newListings) {
                const title = listing.title ?? "Geen titel";
                const price = formatPrice(listing);
                const location = listing.location?.cityName ?? "";
                console.log(`  ${BOLD}${title}${RESET}  ${price}  ${location}`);
                if (listing.vipUrl) {
                  console.log(`  ${DIM}https://www.marktplaats.nl${listing.vipUrl}${RESET}`);
                }
              }
              console.log();
            }

            if (priceChanges.length > 0) {
              console.log(
                `${YELLOW}[${formatTimestamp()}] ${priceChanges.length} price change(s):${RESET}`,
              );
              for (const { listing, oldPrice, newPrice } of priceChanges) {
                const title = listing.title ?? "Geen titel";
                const oldStr =
                  oldPrice !== undefined ? `€${(oldPrice / 100).toFixed(2)}` : "unknown";
                const newStr =
                  newPrice !== undefined ? `€${(newPrice / 100).toFixed(2)}` : "unknown";
                console.log(`  ${BOLD}${title}${RESET}  ${oldStr} → ${newStr}`);
              }
              console.log();
            }

            if (newListings.length === 0 && priceChanges.length === 0) {
              process.stdout.write(`${DIM}[${formatTimestamp()}] No changes${RESET}\r`);
            }
          } catch {
            console.error(`${DIM}[${formatTimestamp()}] Check failed, retrying...${RESET}`);
          }
        }, args.interval * 1000);

        // Cleanup on SIGINT
        process.on("SIGINT", () => {
          clearInterval(timer);
          console.log(`\n${DIM}Stopped watching.${RESET}`);
          process.exit(0);
        });
      });
    }),
);
