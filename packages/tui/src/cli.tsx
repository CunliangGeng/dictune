#!/usr/bin/env bun
import { render } from "ink";
import React from "react";
import { App } from "./App.js";

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === "--help" || cmd === "-h") {
  console.log(`Usage: dictune [options] [command]

Commands:
  update     Update to the latest version

Options:
  -h, --help     Show this help message
  -v, --version  Show the current version`);
  process.exit(0);
}

const pkg = await import("../package.json");

if (cmd === "--version" || cmd === "-v") {
  console.log(pkg.version);
  process.exit(0);
}

if (cmd === "update") {
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
