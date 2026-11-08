import type { BunPlugin } from "bun";
import { isDir, logDate } from "./@";
import { watch } from "node:fs";
import { readdir, rm, rmdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

// ---  ---------------------------------------------------------------

type _minify = {
  identifiers?: boolean;
  whitespace?: boolean;
  syntax?: boolean;
};

type ovenOptions = {
  files?: string[];
  target?: "browser" | "bun";
  define?: Record<string, any>;
  hashAsset?: boolean;
  external?: string[];
  packages?: "external" | "bundle";
  drop?: string[];
  plugins?: BunPlugin[];
  out?: string;
  dir?: string;
  base?: string;
  minify?: _minify;
  split?: boolean;
  successFN?: () => Promise<void>;
};

// ---  ---------------------------------------------------------------

export class Oven {
  dir: string;
  out: string;
  split: boolean;
  minify: _minify;
  hashAsset: boolean;
  drop: any;
  files: string[];
  external: string[];
  packages: "external" | "bundle";
  plugins: BunPlugin[];
  exclude: string[] = [];
  clearAll: boolean = false;
  target: string;
  define: Record<string, any> = {};
  private clearing?: boolean = false;
  protected successFN?: (() => Promise<void>) | undefined;
  constructor({
    //
    files = ["."],
    target = "bun",
    dir = "./src",
    out,
    split = true,
    base = "",
    // ---  ---------------------------------------------------------------
    define = {},
    external = [],
    packages = "bundle",
    drop = [],
    plugins = [],
    hashAsset,
    minify = {},
    successFN,
  }: ovenOptions = {}) {
    //
    this.target = target;
    this.dir = dir + base;
    this.packages = packages;

    this.out =
      (out ? out : target === "browser" ? "./client" : "./dist") + base;

    this.split = split;

    this.files = files.map((m) => (this.dir + "/" + m).replaceAll("//", "/"));

    isDir(this.out);
    // ---  ---------------------------------------------------------------

    this.hashAsset = hashAsset === undefined ? false : hashAsset;
    this.minify = { identifiers: true, whitespace: true, syntax: true };

    // ---  ---------------------------------------------------------------
    this.external = external;
    this.drop = drop;
    this.plugins = plugins;

    this.successFN = successFN;
    Object.assign(this.minify, minify);
    Object.assign(this.define, define);
  }
  set onsuccess(fn: () => Promise<void>) {
    this.successFN = fn;
  }
  async build(status: watchStatus = { building: false }) {
    const asset = `[dir]/[name]${this.hashAsset ? "-[hash]" : ""}.[ext]`;

    if (this.files.length) {
      try {
        const Build = await Bun.build({
          entrypoints: this.files,
          outdir: this.out,
          splitting: this.split,
          minify: this.minify,
          target: (this.target as "browser") ?? "browser",
          naming: {
            chunk: "[dir]/[name]-[hash].[ext]",
            entry: "[dir]/[name].[ext]",
            asset,
          },
          define: {
            ...ProcessDefine(this.define),
          },
          loader: {
            ".css": "file",
          },
          packages: this.packages,
          external: this.external,
          drop: this.drop,
          plugins: this.plugins,
        });

        if (Build.success) {
          // run fn here

          try {
            await this.successFN?.();
            logDate("builder");
            //
            status.building = false;
          } catch (e) {
            console.log(e);
          }
        } else {
          console.log(Build.logs);
        }
      } catch (e) {
        status.building = false;
        console.log(e);
      }
    }

    return this;
  }
  async watch(condition: (filename: string) => boolean = () => true) {
    let timer: NodeJS.Timeout | null = null;
    let lastRun = 0;
    let status: watchStatus = {
      building: false,
    };

    const watcher = watch(
      this.dir,
      { recursive: true },
      async (event, filename) => {
        const now = Date.now();
        if (now - lastRun < 1000) return;
        if (status.building) return;

        if (filename && condition(filename)) {
          lastRun = now;
          status.building = true;
          this.clearing && (await this.clear());
          try {
            await this.build(status);
          } catch (e) {
            status.building = false;
            console.error(e);
          }
        }
      },
    );

    process.on("SIGINT", () => {
      console.log("\nwatcher closed...");
      watcher.close();
      process.exit(0);
    });
  }
  async clear(c: { exclude?: string[]; all?: boolean } = { exclude: [] }) {
    //
    if (c.exclude && c.exclude.length) this.exclude.push(...c.exclude);
    if (c.all !== undefined) this.clearAll = c.all;

    this.clearing = true;

    const recurse = async (_PATH: string) => {
      const entries = await readdir(_PATH);

      for (const ff of entries) {
        if (
          ff.startsWith(".") ||
          (!this.clearAll &&
            (ff.endsWith(".html") || this.exclude.includes(ff)))
        ) {
          continue;
        }

        const full = path.join(_PATH, ff);
        const s = await stat(full);

        if (s.isDirectory()) {
          await recurse(full);
        } else {
          await unlink(full);
        }
      }

      // ✅ after cleaning children, remove folder if empty
      const remaining = await readdir(_PATH);
      if (remaining.length === 0) {
        await rmdir(_PATH);
      }
    };

    await recurse(this.out);

    return this;
  }
}

const ProcessDefine = (define: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(define).map(([k, v]) => {
      let lv = v;
      if (typeof v === "function") {
        lv = v();
      }
      return [k, JSON.stringify(lv)];
    }),
  );
};

// ---  ---------------------------------------------------------------

type watchStatus = {
  building: boolean;
};
