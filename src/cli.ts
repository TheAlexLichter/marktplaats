import { Effect } from "effect";
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime, NodeHttpClient } from "@effect/platform-node";
import { createRequire } from "node:module";
import { categoriesCommand } from "./commands/categories.js";
import { configCommand } from "./commands/config.js";
import { openCommand } from "./commands/open.js";
import { savedCommand } from "./commands/saved.js";
import { searchCommand } from "./commands/search.js";
import { sellerCommand } from "./commands/seller.js";
import { viewCommand } from "./commands/view.js";
import { watchCommand } from "./commands/watch.js";
import { MarktplaatsClientLive } from "./services/MarktplaatsClient.js";
import { ConfigLive } from "./services/Config.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const rootCommand = Command.make("marktplaats").pipe(
  Command.withSubcommands([
    searchCommand,
    viewCommand,
    openCommand,
    configCommand,
    savedCommand,
    categoriesCommand,
    watchCommand,
    sellerCommand,
  ]),
);

const cli = Command.run(rootCommand, {
  name: "marktplaats",
  version,
});

cli(process.argv).pipe(
  Effect.provide(MarktplaatsClientLive),
  Effect.provide(ConfigLive),
  Effect.provide(NodeHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
);
