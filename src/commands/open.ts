import { Console, Effect } from "effect";
import { Args, Command } from "@effect/cli";
import { openInBrowser } from "../browser.js";

const itemId = Args.text({ name: "itemId" });

export const openCommand = Command.make("open", { itemId }, (args) =>
  Effect.gen(function* () {
    const url = `https://www.marktplaats.nl/v/item/${args.itemId}.html`;
    openInBrowser(url);
    yield* Console.log(`Opening ${url}`);
  }),
);
