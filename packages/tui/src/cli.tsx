#!/usr/bin/env bun
import { render } from "ink";
import React from "react";
import { App } from "./App.js";

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === "--help" || cmd === "-h") {
  console.log(`Usage: dictune [options] [command]

Commands:
  update      Update to the latest version
  uninstall   Remove dictune binary

Options:
  -h, --help     Show this help message
  -v, --version  Show the current version`);
  process.exit(0);
}

if (cmd === "--version" || cmd === "-v") {
  const pkg = await import("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

if (cmd === "uninstall") {
  const { unlinkSync } = await import("node:fs");
  const binPath = process.execPath;

  try {
    unlinkSync(binPath);
    console.log(`Removed ${binPath}`);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`Binary not found at ${binPath}, skipping`);
    } else {
      throw err;
    }
  }

  console.log("Dictune has been uninstalled.");
  process.exit(0);
}

if (cmd === "update") {
  const pkg = await import("../package.json");
  const res = await fetch(
    "https://github.com/CunliangGeng/dictune/releases/latest",
    { redirect: "manual" },
  );
  const location = res.headers.get("location") || "";
  const latestTag = location.split("/").pop() || "";
  const latestVersion = latestTag.replace(/^v/, "");

  if (latestVersion && pkg.version === latestVersion) {
    console.log(`Already up to date (v${pkg.version})`);
    process.exit(0);
  }

  if (latestVersion) {
    console.log(`Updating v${pkg.version} → v${latestVersion}...`);
  }

  const url =
    "https://raw.githubusercontent.com/CunliangGeng/dictune/main/install.sh";
  const proc = Bun.spawn(["bash", "-c", `curl -fsSL ${url} | bash`], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  process.exit(code);
}

render(React.createElement(App));
