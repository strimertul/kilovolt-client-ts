import { build } from "https://deno.land/x/dnt@0.20.1/mod.ts";

await build({
  entryPoints: ["./index.ts"],
  outDir: "./npm",
  shims: {},
  package: {
    name: "@strimertul/kilovolt-client",
    version: Deno.args[0],
    description: "Client for interacting with Kilovolt websocket servers",
    keywords: [],
    author: "Ash Keel",
    license: "ISC",
    repository: {
      type: "git",
      url: "git+https://github.com/strimertul/kilovolt-client-ts.git",
    },
    bugs: {
      url: "https://github.com/strimertul/kilovolt-client-ts/issues",
    },
    homepage: "https://github.com/strimertul/kilovolt-client-ts#readme",
  },
});

// post build steps
Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
