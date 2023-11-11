import { build } from "https://deno.land/x/dnt@0.34.0/mod.ts";

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  esModule: true,
  compilerOptions: {
    lib: ["es2017", "dom"],
  },
  package: {
    name: "@strimertul/kilovolt-client",
    version: Deno.args[0],
    description: "Client for interacting with Kilovolt websocket servers",
    keywords: [],
    author: "Ash Keel",
    license: "ISC",
    repository: {
      type: "git",
      url: "git+https://git.sr.ht/~ashkeel/kilovolt-client-ts",
    },
    bugs: {
      url: "https://lists.sr.ht/~ashkeel/strimertul-devel",
    },
    homepage: "https://git.sr.ht/~ashkeel/kilovolt-client-ts",
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
