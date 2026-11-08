import { Oven, Roll, Cmd } from "./src";

const OV = new Oven({
  external: ["rollup", "rollup-plugin-dts"],
});

const RP = new Roll({
  input: "./index.d.ts",
});

OV.onsuccess = async () => {
  await RP.tsc();
  await RP.output({ file: "./index.d.ts", format: "esm" });
};

await OV.build();
