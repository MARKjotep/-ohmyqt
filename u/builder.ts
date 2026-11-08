import { Roll, Oven } from "@coff-r/oven";

const Ov = new Oven({
  external: ["reflect-metadata", "bun"],
});

const RP = new Roll({
  input: "./index.d.ts",
}).paths({
  "@": "",
});

await Ov.clear();

Ov.onsuccess = async () => {
  await RP.tsc({
    path: "./tsconfig.build.json",
  });

  await RP.output({ file: "./index.d.ts", format: "esm" });
};

await Ov.build();
// await Ov.watch();
