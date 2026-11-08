import type { RollupOptions, OutputOptions, InputPluginOption, Plugin, InputOption } from "rollup";
type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
type xtraRoll = {
    log?: boolean;
    dir?: string;
    out?: string;
};
/**
 * const RP = new Roll({input: "./index.d.ts"});

await RP.output({
  file: "./dist/index.d.ts",
  format: "es",
});
 */
export declare class Roll {
    log: boolean;
    plugins: InputPluginOption[];
    alias?: Plugin;
    dir: string;
    out: string;
    input: InputOption;
    options: Omit<RollupOptions, "output">;
    constructor(options: MakeRequired<Omit<RollupOptions, "output">, "input"> & xtraRoll);
    paths(paths?: Record<string, string>): this;
    tsc(tspath?: tscOptions): Promise<void>;
    output(out: OutputOptions): Promise<void>;
}
type tscOptions = {
    clear?: boolean;
    path?: string;
};
export {};
