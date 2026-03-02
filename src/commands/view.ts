import { Console, Effect } from "effect";
import { Args, Command } from "@effect/cli";
import { MarktplaatsClient } from "../services/MarktplaatsClient.js";
import { formatAsJson, formatListingDetail } from "../formatters/listing.js";
import { catchApiErrors } from "../errors.js";
import { json } from "../options.js";

const itemId = Args.text({ name: "itemId" });

export const viewCommand = Command.make("view", { itemId, json }, (args) =>
  Effect.gen(function* () {
    const client = yield* MarktplaatsClient;

    const result = yield* catchApiErrors(
      client.search({
        query: args.itemId,
        limit: 1,
      }),
    );

    const listing = result.listings.find((l) => l.itemId === args.itemId);
    if (!listing) {
      yield* Console.error(`Listing "${args.itemId}" not found.`);
      return;
    }

    if (args.json) {
      yield* Console.log(formatAsJson(listing));
    } else {
      yield* Console.log(formatListingDetail(listing));
    }
  }),
);
