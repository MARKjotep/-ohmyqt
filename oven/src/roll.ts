import type {
  RollupOptions,
  OutputOptions,
  InputPluginOption,
  Plugin,
  InputOption,
} from "rollup";
import { rollup } from "rollup";
import { dts } from "rollup-plugin-dts";
import { logDate } from "./@";
import alias, { type Alias } from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import path from "path";
import { Cmd } from "./cmd";

type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

type xtraRoll = { log?: boolean; dir?: string; out?: string };

/**
 * const RP = new Roll({input: "./index.d.ts"});

await RP.output({
  file: "./dist/index.d.ts",
  format: "es",
});
 */
export class Roll {
  log: boolean;
  plugins: InputPluginOption[];
  alias?: Plugin;
  dir: string;
  out: string;
  input: InputOption;
  options: Omit<RollupOptions, "output">;
  constructor(
    options: MakeRequired<Omit<RollupOptions, "output">, "input"> & xtraRoll,
  ) {
    const {
      log,
      dir = "./types",
      out = "./dist",
      input,
      plugins,
      ...opts
    } = options;
    this.dir = dir;
    this.out = out;

    if (typeof input === "object") {
      if (Array.isArray(input)) {
        this.input = input.map((m) => path.resolve(this.dir, m));
      } else {
        const ob = Object.entries(input).map(([k, v]) => {
          return [k, path.resolve(this.dir, v)];
        });
        this.input = Object.fromEntries(ob);
      }
    } else {
      this.input = path.resolve(this.dir, input ?? "");
    }

    this.plugins = plugins
      ? Array.isArray(plugins)
        ? [...plugins, dts()]
        : [plugins, dts()]
      : [dts()];
    this.options = opts;
    this.log = Boolean(log);

    delete options.log;
  }
  paths(paths: Record<string, string> = {}) {
    const als: Alias[] = [];
    for (const pt in paths) {
      als.push({ find: pt, replacement: path.resolve(this.dir, paths[pt]!) });
    }

    this.alias = alias({
      entries: als,
    });

    return this;
  }

  async tsc(tspath: tscOptions = {}) {
    const { clear, path: tpath } = tspath;

    if (clear) await Cmd(`rm -r ${this.dir}`);

    await Cmd(`tsc` + (tpath ? ` -p ${tpath}` : ""));
  }
  async output(out: OutputOptions) {
    out.file &&= path.resolve(this.out, out.file);
    out.format ??= "es";

    try {
      const rp = await rollup({
        input: this.input,
        ...this.options,
        plugins: [
          ...this.plugins,
          this.alias,
          resolve({
            extensions: [".js", ".ts", ".json"],
          }),
          commonjs(),
        ],
      });
      await rp.write(out);
      await rp.close();
      this.log && logDate("rollup");
    } catch (error) {
      console.error("Build failed:", error);
    }
  }
}

type tscOptions = {
  clear?: boolean;
  path?: string;
};
