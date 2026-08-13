// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/api/*", "/books/*"],
  exclude: []
};

// ../../Users/digim/AppData/Roaming/npm/node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\OpenCode Project\\Children book\\.wrangler\\tmp\\pages-oey5ce\\functionsWorker-0.4786671686937535.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\digim\\AppData\\Roaming\\npm\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\OpenCode Project\\Children book\\.wrangler\\tmp\\pages-oey5ce\\functionsWorker-0.4786671686937535.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=jgs40t5uqw.js.map
