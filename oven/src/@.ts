import { existsSync, mkdirSync } from "node:fs";

export const isDir = (path: string) => {
  if (existsSync(path)) return true;

  mkdirSync(path, { recursive: true });
  return true;
};

export const logDate = (message: string) => {
  const dt = new Date().toLocaleTimeString();
  console.log(`${message} @ ${dt}`);
};
