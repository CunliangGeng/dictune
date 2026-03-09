/**
 * Build script for compiling TUI into a standalone executable.
 * Uses a plugin to stub react-devtools-core (ink's optional peer dep).
 *
 * Usage:
 *   bun run build.ts                              # build for current platform
 *   bun run build.ts --target bun-linux-x64       # cross-compile
 *   bun run build.ts --outfile dist/dictune-linux  # custom output path
 */
const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const target = getArg("target") as Parameters<
  typeof Bun.build
>[0]["compile"] extends infer T
  ? T extends { target?: infer U }
    ? U
    : never
  : never;
const isWindows = target?.includes("windows") ?? false;
const defaultOutfile = `dist/dictune${isWindows ? ".exe" : ""}`;
const outfile = getArg("outfile") ?? defaultOutfile;

const compile: Record<string, unknown> = { outfile };
if (target) compile.target = target;

const result = await Bun.build({
  entrypoints: ["src/cli.tsx"],
  compile: compile as { outfile: string; target?: string },
  minify: true,
  sourcemap: "linked",
  plugins: [
    {
      name: "stub-react-devtools",
      setup(build) {
        build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
          path: "react-devtools-core",
          namespace: "stub",
        }));
        build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: "export default undefined;",
          loader: "js",
        }));
      },
    },
  ],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
