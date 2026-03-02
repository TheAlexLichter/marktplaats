import { Context, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "@effect/platform";
import type { SearchParams } from "../schemas/SearchParams.js";
import { SearchResponse } from "../schemas/SearchResponse.js";
import { MarktplaatsApiError, MarktplaatsNetworkError, MarktplaatsParseError } from "../errors.js";

const BASE_URL = "https://www.marktplaats.nl/lrp/api/search";

export class MarktplaatsClient extends Context.Tag("MarktplaatsClient")<
  MarktplaatsClient,
  {
    readonly search: (
      params: SearchParams,
    ) => Effect.Effect<
      typeof SearchResponse.Type,
      MarktplaatsApiError | MarktplaatsNetworkError | MarktplaatsParseError
    >;
    readonly getListingUrl: (itemId: string) => string;
  }
>() {}

export function buildSearchUrl(params: SearchParams): string {
  const url = new URL(BASE_URL);
  url.searchParams.set("query", params.query);
  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit));
  if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));
  if (params.sortBy !== undefined) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder !== undefined) url.searchParams.set("sortOrder", params.sortOrder);
  if (params.postcode !== undefined) url.searchParams.set("postcode", params.postcode);
  if (params.distanceMeters !== undefined)
    url.searchParams.set("distanceMeters", String(params.distanceMeters));
  if (params.l1CategoryId !== undefined)
    url.searchParams.set("l1CategoryId", String(params.l1CategoryId));
  if (params.l2CategoryId !== undefined)
    url.searchParams.set("l2CategoryId", String(params.l2CategoryId));
  if (params.searchInTitleAndDescription !== undefined) {
    url.searchParams.set("searchInTitleAndDescription", String(params.searchInTitleAndDescription));
  }
  if (params.minPriceCents !== undefined)
    url.searchParams.set("minPriceCents", String(params.minPriceCents));
  if (params.maxPriceCents !== undefined)
    url.searchParams.set("maxPriceCents", String(params.maxPriceCents));
  return url.toString();
}

export const MarktplaatsClientLive = Layer.effect(
  MarktplaatsClient,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    return {
      search: (params: SearchParams) =>
        Effect.gen(function* () {
          const url = buildSearchUrl(params);
          const response = yield* httpClient
            .get(url)
            .pipe(
              Effect.catchAll((error) =>
                Effect.fail(new MarktplaatsNetworkError({ cause: error })),
              ),
            );

          if (response.status >= 400) {
            return yield* Effect.fail(
              new MarktplaatsApiError({
                status: response.status,
                message: `API returned status ${response.status}`,
              }),
            );
          }

          const data = yield* HttpClientResponse.schemaBodyJson(SearchResponse)(response).pipe(
            Effect.catchAll((error) => Effect.fail(new MarktplaatsParseError({ cause: error }))),
          );

          return data;
        }),

      getListingUrl: (itemId: string) => `https://www.marktplaats.nl/v/item/${itemId}.html`,
    };
  }),
);
