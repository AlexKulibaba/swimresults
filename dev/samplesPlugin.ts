import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

const ROUTE = "/__samples/";

/**
 * Dev server only: lists and serves the local meet files in `samples/` so they can be loaded with one click.
 * `apply: "serve"` keeps the samples out of every build (ADR 0001).
 */
export function samplesPlugin(samplesDir: string): Plugin {
  return {
    name: "swimresults:dev-samples",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(ROUTE, (req, res) => {
        const files = readdirSync(samplesDir).filter((file) => /\.(lxf|lef)$/i.test(file)).sort();
        const requested = decodeURIComponent((req.url ?? "/").slice(1));

        if (requested === "") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
        } else if (files.includes(requested)) {
          res.setHeader("Content-Type", "application/octet-stream");
          res.end(readFileSync(join(samplesDir, requested)));
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}
