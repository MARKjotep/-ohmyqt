import type { BunPlugin } from "bun";
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
export declare class Oven {
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
    exclude: string[];
    clearAll: boolean;
    target: string;
    define: Record<string, any>;
    private clearing?;
    protected successFN?: (() => Promise<void>) | undefined;
    constructor({ files, target, dir, out, split, base, define, external, packages, drop, plugins, hashAsset, minify, successFN, }?: ovenOptions);
    set onsuccess(fn: () => Promise<void>);
    build(status?: watchStatus): Promise<this>;
    watch(condition?: (filename: string) => boolean): Promise<void>;
    clear(c?: {
        exclude?: string[];
        all?: boolean;
    }): Promise<this>;
}
type watchStatus = {
    building: boolean;
};
export {};
