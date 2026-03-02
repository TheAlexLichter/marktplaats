import { Console, Effect, Option } from "effect";
import { Args, Command, Options } from "@effect/cli";
import { MarktplaatsClient } from "../services/MarktplaatsClient.js";
import { readSavedSearches, writeSavedSearches } from "../services/SavedSearches.js";
import { formatAsJson, formatListingList } from "../formatters/listing.js";
import { eurosToCents } from "../utils.js";
import { catchApiErrors } from "../errors.js";

// saved add <name> <query> [options]
const addName = Args.text({ name: "name" });
const addQuery = Args.text({ name: "query" });

const addLimit = Options.integer("limit").pipe(Options.withAlias("l"), Options.optional);
const addSort = Options.text("sort").pipe(Options.withAlias("s"), Options.optional);
const addSortOrder = Options.text("sort-order").pipe(Options.optional);
const addPostcode = Options.text("postcode").pipe(Options.withAlias("p"), Options.optional);
const addDistance = Options.integer("distance").pipe(Options.withAlias("d"), Options.optional);
const addCategory = Options.integer("category").pipe(Options.optional);
const addMinPrice = Options.text("min-price").pipe(Options.optional);
const addMaxPrice = Options.text("max-price").pipe(Options.optional);

const savedAddCommand = Command.make(
  "add",
  {
    name: addName,
    query: addQuery,
    limit: addLimit,
    sort: addSort,
    sortOrder: addSortOrder,
    postcode: addPostcode,
    distance: addDistance,
    category: addCategory,
    minPrice: addMinPrice,
    maxPrice: addMaxPrice,
  },
  (args) =>
    Effect.gen(function* () {
      const searches = readSavedSearches();
      const existing = searches.findIndex((s) => s.name === args.name);

      const entry = {
        name: args.name,
        query: args.query,
        limit: Option.getOrUndefined(args.limit),
        sort: Option.getOrUndefined(args.sort),
        sortOrder: Option.getOrUndefined(args.sortOrder),
        postcode: Option.getOrUndefined(args.postcode),
        distance: Option.getOrUndefined(args.distance),
        category: Option.getOrUndefined(args.category),
        minPrice: Option.getOrUndefined(args.minPrice),
        maxPrice: Option.getOrUndefined(args.maxPrice),
      };

      if (existing >= 0) {
        searches[existing] = entry;
        yield* Console.log(`Updated saved search "${args.name}".`);
      } else {
        searches.push(entry);
        yield* Console.log(`Saved search "${args.name}".`);
      }

      writeSavedSearches(searches);
    }),
);

// saved list
const savedListCommand = Command.make("list", {}, () =>
  Effect.gen(function* () {
    const searches = readSavedSearches();
    if (searches.length === 0) {
      yield* Console.log("No saved searches.");
      return;
    }
    for (const s of searches) {
      const parts = [`"${s.query}"`];
      if (s.postcode) parts.push(`postcode:${s.postcode}`);
      if (s.distance) parts.push(`distance:${s.distance}m`);
      if (s.category) parts.push(`category:${s.category}`);
      if (s.minPrice) parts.push(`min:€${s.minPrice}`);
      if (s.maxPrice) parts.push(`max:€${s.maxPrice}`);
      yield* Console.log(`  ${s.name}  ${parts.join("  ")}`);
    }
  }),
);

// saved run <name>
const runName = Args.text({ name: "name" });
const runJson = Options.boolean("json").pipe(Options.withDefault(false));
const runPage = Options.integer("page").pipe(Options.withDefault(1));

const savedRunCommand = Command.make(
  "run",
  { name: runName, json: runJson, page: runPage },
  (args) =>
    Effect.gen(function* () {
      const searches = readSavedSearches();
      const search = searches.find((s) => s.name === args.name);
      if (!search) {
        yield* Console.error(`Saved search "${args.name}" not found.`);
        return;
      }

      const client = yield* MarktplaatsClient;
      const limit = search.limit ?? 25;
      const offset = (args.page - 1) * limit;

      const result = yield* catchApiErrors(
        client.search({
          query: search.query,
          limit,
          offset,
          sortBy: search.sort as any,
          sortOrder: search.sortOrder as any,
          postcode: search.postcode,
          distanceMeters: search.distance,
          l1CategoryId: search.category,
          minPriceCents: search.minPrice ? eurosToCents(search.minPrice) : undefined,
          maxPriceCents: search.maxPrice ? eurosToCents(search.maxPrice) : undefined,
        }),
      );

      if (args.json) {
        yield* Console.log(formatAsJson(result));
      } else {
        yield* Console.log(
          formatListingList(result.listings, {
            page: args.page,
            limit,
            totalResults: result.totalResultCount ?? result.listings.length,
          }),
        );
      }
    }),
);

// saved remove <name>
const removeName = Args.text({ name: "name" });

const savedRemoveCommand = Command.make("remove", { name: removeName }, (args) =>
  Effect.gen(function* () {
    const searches = readSavedSearches();
    const filtered = searches.filter((s) => s.name !== args.name);
    if (filtered.length === searches.length) {
      yield* Console.error(`Saved search "${args.name}" not found.`);
      return;
    }
    writeSavedSearches(filtered);
    yield* Console.log(`Removed saved search "${args.name}".`);
  }),
);

export const savedCommand = Command.make("saved").pipe(
  Command.withSubcommands([savedAddCommand, savedListCommand, savedRunCommand, savedRemoveCommand]),
);
