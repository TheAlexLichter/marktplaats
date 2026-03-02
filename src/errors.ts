import { Data, Effect } from "effect";

export class MarktplaatsApiError extends Data.TaggedError("MarktplaatsApiError")<{
  readonly status: number;
  readonly message: string;
}> {}

export class MarktplaatsNetworkError extends Data.TaggedError("MarktplaatsNetworkError")<{
  readonly cause: unknown;
}> {}

export class MarktplaatsParseError extends Data.TaggedError("MarktplaatsParseError")<{
  readonly cause: unknown;
}> {}

export function catchApiErrors<A>(
  effect: Effect.Effect<A, MarktplaatsApiError | MarktplaatsNetworkError | MarktplaatsParseError>,
): Effect.Effect<A, Error> {
  return effect.pipe(
    Effect.catchTags({
      MarktplaatsApiError: (e) => Effect.fail(new Error(`API error (${e.status}): ${e.message}`)),
      MarktplaatsNetworkError: (e) => Effect.fail(new Error(`Network error: ${e.cause}`)),
      MarktplaatsParseError: (e) => Effect.fail(new Error(`Failed to parse response: ${e.cause}`)),
    }),
  );
}
