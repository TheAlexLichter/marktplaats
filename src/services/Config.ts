import { Context, Effect, Layer } from "effect";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface MarktplaatsConfig {
  readonly postcode?: string;
  readonly distance?: number;
  readonly sort?: "SORT_INDEX" | "OPTIMIZED" | "DATE" | "PRICE" | "LOCATION";
  readonly sortOrder?: "INCREASING" | "DECREASING";
  readonly limit?: number;
}

export function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg ? join(xdg, "marktplaats") : join(homedir(), ".config", "marktplaats");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export function readConfig(): MarktplaatsConfig {
  try {
    const raw = readFileSync(getConfigPath(), "utf-8");
    return JSON.parse(raw) as MarktplaatsConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: MarktplaatsConfig): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + "\n");
}

export class Config extends Context.Tag("Config")<
  Config,
  {
    readonly read: () => Effect.Effect<MarktplaatsConfig>;
    readonly write: (config: MarktplaatsConfig) => Effect.Effect<void>;
    readonly path: () => string;
  }
>() {}

export const ConfigLive = Layer.succeed(Config, {
  read: () => Effect.sync(() => readConfig()),
  write: (config: MarktplaatsConfig) => Effect.sync(() => writeConfig(config)),
  path: () => getConfigPath(),
});
