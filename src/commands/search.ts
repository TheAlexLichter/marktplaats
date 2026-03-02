import { Console, Effect, Option } from "effect";
import { Args, Command, Options } from "@effect/cli";
import { MarktplaatsClient } from "../services/MarktplaatsClient.js";
import { Config } from "../services/Config.js";
import { formatAsJson, formatListingList } from "../formatters/listing.js";
import { startTui } from "../tui.js";
import type { SearchParams } from "../schemas/SearchParams.js";
import { eurosToCents } from "../utils.js";
import { catchApiErrors } from "../errors.js";
import { postcode, distance, category, minPrice, maxPrice, json } from "../options.js";

const query = Args.text({ name: "query" });

const limit = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDescription("Number of results per page"),
  Options.withDefault(25),
);

const sort = Options.choice("sort", ["DATE", "PRICE", "OPTIMIZED", "LOCATION", "SORT_INDEX"]).pipe(
  Options.withAlias("s"),
  Options.withDescription("Sort results by"),
  Options.withDefault("SORT_INDEX" as "DATE" | "PRICE" | "OPTIMIZED" | "LOCATION" | "SORT_INDEX"),
);

const sortOrder = Options.choice("sort-order", ["DECREASING", "INCREASING"]).pipe(
  Options.withDescription("Sort order"),
  Options.withDefault("DECREASING" as "DECREASING" | "INCREASING"),
);

const page = Options.integer("page").pipe(
  Options.withDescription("Page number"),
  Options.withDefault(1),
);

const interactive = Options.boolean("interactive").pipe(
  Options.withAlias("i"),
  Options.withDescription("Interactive TUI mode"),
  Options.withDefault(false),
);

export const searchCommand = Command.make(
  "search",
  {
    query,
    limit,
    sort,
    sortOrder,
    postcode,
    distance,
    category,
    page,
    minPrice,
    maxPrice,
    interactive,
    json,
  },
  (args) =>
    Effect.gen(function* () {
      const client = yield* MarktplaatsClient;
      const cfg = yield* Config;
      const defaults = yield* cfg.read();
      const offset = (args.page - 1) * args.limit;

      const searchParams: SearchParams = {
        query: args.query,
        limit: args.limit,
        offset,
        sortBy: args.sort,
        sortOrder: args.sortOrder,
        postcode: Option.getOrElse(args.postcode, () => defaults.postcode),
        distanceMeters: Option.getOrElse(args.distance, () => defaults.distance),
        l1CategoryId: Option.getOrUndefined(args.category),
        minPriceCents: Option.map(args.minPrice, eurosToCents).pipe(Option.getOrUndefined),
        maxPriceCents: Option.map(args.maxPrice, eurosToCents).pipe(Option.getOrUndefined),
      };

      const result = yield* catchApiErrors(client.search(searchParams));

      if (args.json) {
        yield* Console.log(formatAsJson(result));
      } else if (args.interactive) {
        yield* Effect.promise(() =>
          startTui({
            listings: result.listings,
            page: args.page,
            limit: args.limit,
            totalResults: result.totalResultCount ?? result.listings.length,
            onPageChange: async (newPage) => {
              const newResult = await Effect.runPromise(
                client
                  .search({ ...searchParams, offset: (newPage - 1) * args.limit })
                  .pipe(
                    Effect.catchAll(() =>
                      Effect.succeed({ listings: [] as any[], totalResultCount: 0 }),
                    ),
                  ),
              );
              return {
                listings: newResult.listings,
                totalResults: newResult.totalResultCount ?? newResult.listings.length,
              };
            },
          }),
        );
      } else {
        yield* Console.log(
          formatListingList(result.listings, {
            page: args.page,
            limit: args.limit,
            totalResults: result.totalResultCount ?? result.listings.length,
          }),
        );
      }
    }),
);
