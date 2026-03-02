import { Schema } from "effect";
import { Listing } from "./Listing.js";

export const SearchResponse = Schema.Struct({
  listings: Schema.Array(Listing),
  totalResultCount: Schema.optional(Schema.Number),
});

export type SearchResponse = typeof SearchResponse.Type;
