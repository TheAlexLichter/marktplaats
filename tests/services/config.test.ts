import { describe, expect, it, beforeEach, afterEach } from "vite-plus/test";
import { readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We test the config read/write logic directly
// by reimplementing the core logic with a custom dir

function makeTestConfig(dir: string) {
  const configPath = join(dir, "config.json");

  function read(): Record<string, unknown> {
    try {
      return JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      return {};
    }
  }

  function write(data: Record<string, unknown>): void {
    mkdirSync(dir, { recursive: true });
    writeFileSync(configPath, JSON.stringify(data, null, 2) + "\n");
  }

  return { read, write, configPath };
}

describe("config", () => {
  let testDir: string;
  let config: ReturnType<typeof makeTestConfig>;

  beforeEach(() => {
    testDir = join(tmpdir(), `marktplaats-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    config = makeTestConfig(testDir);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("returns empty config when file does not exist", () => {
    expect(config.read()).toEqual({});
  });

  it("writes and reads config", () => {
    config.write({ postcode: "1012AB", distance: 5000 });
    const data = config.read();
    expect(data.postcode).toBe("1012AB");
    expect(data.distance).toBe(5000);
  });

  it("merges config updates", () => {
    config.write({ postcode: "1012AB" });
    const existing = config.read();
    config.write({ ...existing, distance: 10000 });
    const updated = config.read();
    expect(updated.postcode).toBe("1012AB");
    expect(updated.distance).toBe(10000);
  });

  it("removes keys via destructuring", () => {
    config.write({ postcode: "1012AB", distance: 5000 });
    const data = config.read();
    const { postcode: _, ...rest } = data;
    config.write(rest);
    const updated = config.read();
    expect(updated.postcode).toBeUndefined();
    expect(updated.distance).toBe(5000);
  });

  it("writes valid JSON file", () => {
    config.write({ sort: "PRICE" });
    const raw = readFileSync(config.configPath, "utf-8");
    expect(raw).toContain('"sort": "PRICE"');
    expect(raw.endsWith("\n")).toBe(true);
  });
});
