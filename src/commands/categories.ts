import { Console, Effect, Option } from "effect";
import { Args, Command } from "@effect/cli";
import { HttpClient } from "@effect/platform";
import { BOLD, CYAN, DIM, RESET } from "../colors.js";

interface CategoryOption {
  id: number;
  name: string;
  fullName?: string;
  key?: string;
}

const searchFilter = Args.text({ name: "filter" }).pipe(Args.optional);

export const categoriesCommand = Command.make("categories", { filter: searchFilter }, (args) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    const response = yield* httpClient
      .get("https://www.marktplaats.nl/lrp/api/search?query=a&limit=1")
      .pipe(Effect.catchAll(() => Effect.fail(new Error("Failed to fetch categories"))));

    const body = yield* response.text.pipe(
      Effect.catchAll(() => Effect.fail(new Error("Failed to read response body"))),
    );
    const json = JSON.parse(body);

    const rawCategories = json.searchCategoryOptions as CategoryOption[] | undefined;
    if (!rawCategories || !Array.isArray(rawCategories)) {
      yield* Console.error("Could not fetch categories from API.");
      return;
    }

    let categories = rawCategories;

    if (Option.isSome(args.filter)) {
      const filter = args.filter.value.toLowerCase();
      categories = categories.filter(
        (c) =>
          c.name.toLowerCase().includes(filter) ||
          (c.fullName ?? "").toLowerCase().includes(filter) ||
          (c.key ?? "").toLowerCase().includes(filter),
      );
    }

    if (categories.length === 0) {
      yield* Console.log("No categories found.");
      return;
    }

    yield* Console.log(`${BOLD}Marktplaats Categories${RESET}\n`);
    yield* Console.log(`${DIM}Use --category <id> with the search command${RESET}\n`);

    for (const cat of categories) {
      yield* Console.log(`  ${CYAN}${String(cat.id).padEnd(6)}${RESET} ${cat.name}`);
    }

    yield* Console.log(`\n${DIM}${categories.length} categories${RESET}`);
  }),
);
