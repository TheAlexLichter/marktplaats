import { Options } from "@effect/cli";

export const postcode = Options.text("postcode").pipe(
  Options.withAlias("p"),
  Options.withDescription("Postcode for location-based search"),
  Options.optional,
);

export const distance = Options.integer("distance").pipe(
  Options.withAlias("d"),
  Options.withDescription("Distance in meters from postcode"),
  Options.optional,
);

export const category = Options.integer("category").pipe(
  Options.withDescription("Category ID"),
  Options.optional,
);

export const minPrice = Options.text("min-price").pipe(
  Options.withDescription("Minimum price in euros (e.g. 10 or 10.50)"),
  Options.optional,
);

export const maxPrice = Options.text("max-price").pipe(
  Options.withDescription("Maximum price in euros (e.g. 100 or 99.99)"),
  Options.optional,
);

export const json = Options.boolean("json").pipe(
  Options.withDescription("Output as JSON"),
  Options.withDefault(false),
);
