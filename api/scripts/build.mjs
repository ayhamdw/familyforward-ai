// Bundles the API into dist/server.js. Only @familyforward/shared (TypeScript source) is inlined;
// every other package stays external and is loaded from node_modules at runtime.
import { build } from "esbuild";

await build({
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: false,
  logLevel: "info",
  plugins: [
    {
      name: "externalize-packages",
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith("@familyforward/shared") || args.path.startsWith("node:")) {
            return undefined;
          }
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
