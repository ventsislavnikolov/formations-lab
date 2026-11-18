#!/usr/bin/env node
// Installs the lefthook Git hooks on `pnpm install`. Skipped on CI and
// Vercel builds, and wherever there is no Git checkout.
import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.env.CI || process.env.VERCEL) {
  console.log("Skipping Git hooks on CI.");
  process.exit(0);
}
const git = spawnSync("git", ["rev-parse", "--git-dir"], { stdio: "ignore" });
if (git.status !== 0) {
  console.log("Skipping Git hooks: not a Git checkout.");
  process.exit(0);
}
const lefthook = spawnSync("pnpm", ["exec", "lefthook", "install"], {
  stdio: "inherit",
});
process.exit(lefthook.status ?? 1);
