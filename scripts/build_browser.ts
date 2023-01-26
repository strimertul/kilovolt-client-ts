import * as esbuild from "https://deno.land/x/esbuild@v0.17.4/mod.js";
await esbuild.build({
  bundle: true,
  minify: true,
  keepNames: true,
  target: "es2017", // Required because OBS ships with a really old version of Chrome
  entryPoints: ["./index.ts"],
  outfile: "./dist/kilovolt.js",
  format: "esm",
  sourcemap: true,
});
esbuild.stop();
