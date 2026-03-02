import { Console, Effect, Option } from "effect";
import { Args, Command } from "@effect/cli";
import { Config } from "../services/Config.js";

const configGetKey = Args.text({ name: "key" }).pipe(Args.optional);

const configGetCommand = Command.make("get", { key: configGetKey }, (args) =>
  Effect.gen(function* () {
    const config = yield* Config;
    const data = yield* config.read();

    if (Option.isSome(args.key)) {
      const value = data[args.key.value as keyof typeof data];
      if (value !== undefined) {
        yield* Console.log(String(value));
      } else {
        yield* Console.error(`Key "${args.key.value}" is not set.`);
      }
    } else {
      yield* Console.log(JSON.stringify(data, null, 2));
    }
  }),
);

const setKey = Args.text({ name: "key" });
const setValue = Args.text({ name: "value" });

const configSetCommand = Command.make("set", { key: setKey, value: setValue }, (args) =>
  Effect.gen(function* () {
    const config = yield* Config;
    const data = yield* config.read();

    const validKeys = ["postcode", "distance", "sort", "sortOrder", "limit"];
    if (!validKeys.includes(args.key)) {
      yield* Console.error(`Invalid key "${args.key}". Valid keys: ${validKeys.join(", ")}`);
      return;
    }

    const numericKeys = ["distance", "limit"];
    const updated = {
      ...data,
      [args.key]: numericKeys.includes(args.key) ? Number(args.value) : args.value,
    };

    yield* config.write(updated);
    yield* Console.log(`Set ${args.key} = ${args.value}`);
  }),
);

const configPathCommand = Command.make("path", {}, () =>
  Effect.gen(function* () {
    const config = yield* Config;
    yield* Console.log(config.path());
  }),
);

const unsetKey = Args.text({ name: "key" });

const configUnsetCommand = Command.make("unset", { key: unsetKey }, (args) =>
  Effect.gen(function* () {
    const config = yield* Config;
    const data = yield* config.read();
    const { [args.key as keyof typeof data]: _, ...rest } = data;
    yield* config.write(rest);
    yield* Console.log(`Unset ${args.key}`);
  }),
);

export const configCommand = Command.make("config").pipe(
  Command.withSubcommands([
    configGetCommand,
    configSetCommand,
    configUnsetCommand,
    configPathCommand,
  ]),
);
