import { onRequestGet as __api_assets___key___ts_onRequestGet } from "C:\\OpenCode Project\\Children book\\functions\\api\\assets\\[[key]].ts"
import { onRequestPost as __api_assets___key___ts_onRequestPost } from "C:\\OpenCode Project\\Children book\\functions\\api\\assets\\[[key]].ts"
import { onRequestDelete as __api_books___id___ts_onRequestDelete } from "C:\\OpenCode Project\\Children book\\functions\\api\\books\\[[id]].ts"
import { onRequestGet as __api_books___id___ts_onRequestGet } from "C:\\OpenCode Project\\Children book\\functions\\api\\books\\[[id]].ts"
import { onRequestPost as __api_books___id___ts_onRequestPost } from "C:\\OpenCode Project\\Children book\\functions\\api\\books\\[[id]].ts"
import { onRequestDelete as __api_orders___id___ts_onRequestDelete } from "C:\\OpenCode Project\\Children book\\functions\\api\\orders\\[[id]].ts"
import { onRequestPatch as __api_orders___id___ts_onRequestPatch } from "C:\\OpenCode Project\\Children book\\functions\\api\\orders\\[[id]].ts"
import { onRequestPut as __api_styles___id___ts_onRequestPut } from "C:\\OpenCode Project\\Children book\\functions\\api\\styles\\[[id]].ts"
import { onRequestGet as __api_health_ts_onRequestGet } from "C:\\OpenCode Project\\Children book\\functions\\api\\health.ts"
import { onRequestGet as __api_orders_ts_onRequestGet } from "C:\\OpenCode Project\\Children book\\functions\\api\\orders.ts"
import { onRequestPost as __api_orders_ts_onRequestPost } from "C:\\OpenCode Project\\Children book\\functions\\api\\orders.ts"
import { onRequestPost as __api_seed_ts_onRequestPost } from "C:\\OpenCode Project\\Children book\\functions\\api\\seed.ts"
import { onRequestGet as __api_styles_ts_onRequestGet } from "C:\\OpenCode Project\\Children book\\functions\\api\\styles.ts"

export const routes = [
    {
      routePath: "/api/assets/:key*",
      mountPath: "/api/assets",
      method: "GET",
      middlewares: [],
      modules: [__api_assets___key___ts_onRequestGet],
    },
  {
      routePath: "/api/assets/:key*",
      mountPath: "/api/assets",
      method: "POST",
      middlewares: [],
      modules: [__api_assets___key___ts_onRequestPost],
    },
  {
      routePath: "/api/books/:id*",
      mountPath: "/api/books",
      method: "DELETE",
      middlewares: [],
      modules: [__api_books___id___ts_onRequestDelete],
    },
  {
      routePath: "/api/books/:id*",
      mountPath: "/api/books",
      method: "GET",
      middlewares: [],
      modules: [__api_books___id___ts_onRequestGet],
    },
  {
      routePath: "/api/books/:id*",
      mountPath: "/api/books",
      method: "POST",
      middlewares: [],
      modules: [__api_books___id___ts_onRequestPost],
    },
  {
      routePath: "/api/orders/:id*",
      mountPath: "/api/orders",
      method: "DELETE",
      middlewares: [],
      modules: [__api_orders___id___ts_onRequestDelete],
    },
  {
      routePath: "/api/orders/:id*",
      mountPath: "/api/orders",
      method: "PATCH",
      middlewares: [],
      modules: [__api_orders___id___ts_onRequestPatch],
    },
  {
      routePath: "/api/styles/:id*",
      mountPath: "/api/styles",
      method: "PUT",
      middlewares: [],
      modules: [__api_styles___id___ts_onRequestPut],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_ts_onRequestGet],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_orders_ts_onRequestGet],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_orders_ts_onRequestPost],
    },
  {
      routePath: "/api/seed",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_seed_ts_onRequestPost],
    },
  {
      routePath: "/api/styles",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_styles_ts_onRequestGet],
    },
  ]