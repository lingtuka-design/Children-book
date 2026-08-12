var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/_lib.ts
var ADMIN_DIGEST = "53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36";
function json(data, status = 200, cache = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache
    }
  });
}
__name(json, "json");
function isAuthed(request) {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token.length > 0 && constantTimeEqual(token, ADMIN_DIGEST);
}
__name(isAuthed, "isAuthed");
function constantTimeEqual(a, b) {
  const max = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
async function getSetting(env, key) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row?.value ?? null;
}
__name(getSetting, "getSetting");
async function isSeeded(env) {
  return await getSetting(env, "seeded") === "1";
}
__name(isSeeded, "isSeeded");
async function bootstrapOpen(env) {
  return !await isSeeded(env);
}
__name(bootstrapOpen, "bootstrapOpen");
var ALLOWED_ASSET_PREFIXES = ["books/", "orders/", "styles/"];
var KEY_PATTERN = /^[a-z0-9-]+(\/[a-z0-9_.-]+)*\.(jpg|jpeg|png|webp|svg)$/i;
function validAssetKey(key) {
  if (!KEY_PATTERN.test(key)) return false;
  const prefix = key.split("/")[0] + "/";
  if (!ALLOWED_ASSET_PREFIXES.includes(prefix)) return false;
  if (key.includes("..")) return false;
  return true;
}
__name(validAssetKey, "validAssetKey");
function contentTypeFor(key) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
__name(contentTypeFor, "contentTypeFor");
function isAssetUrl(url) {
  return url.startsWith("/api/assets/") || url.includes("/api/assets/");
}
__name(isAssetUrl, "isAssetUrl");
async function deleteAssetsWithPrefix(env, prefix) {
  let cursor;
  do {
    const listed = await env.BOOK_ASSETS.list({ prefix, cursor });
    if (listed.objects.length > 0) {
      await env.BOOK_ASSETS.delete(listed.objects.map((o) => o.key));
    }
    cursor = listed.truncated ? listed.cursor : void 0;
  } while (cursor);
}
__name(deleteAssetsWithPrefix, "deleteAssetsWithPrefix");

// api/assets/[[key]].ts
var onRequestGet = /* @__PURE__ */ __name(async ({ env, params }) => {
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key ?? "";
  if (!key) return json({ error: "Missing asset key" }, 400);
  const object = await env.BOOK_ASSETS.get(key);
  if (!object) return json({ error: "Asset not found" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}, "onRequestGet");
var onRequestPost = /* @__PURE__ */ __name(async ({ env, request }) => {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Expected multipart form data" }, 400);
  }
  const key = String(form.get("key") ?? "");
  const file = form.get("file");
  if (!validAssetKey(key)) return json({ error: "Invalid asset key" }, 400);
  if (!(file instanceof File) || file.size === 0) return json({ error: "Missing file" }, 400);
  const open = await bootstrapOpen(env);
  const isOrderPhoto = key.startsWith("orders/");
  if (!open && !isOrderPhoto && !isAdmin(request)) {
    return json({ error: "Unauthorized" }, 401);
  }
  await env.BOOK_ASSETS.put(key, file.stream(), {
    httpMetadata: { contentType: contentTypeFor(key) }
  });
  return json({ key, url: `/api/assets/${key}` });
}, "onRequestPost");
function isAdmin(request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  return token === "53842a1e388e10151d4a922030e00e4c74a93973c1a5b05937cee400811c1a36";
}
__name(isAdmin, "isAdmin");

// api/books/[[id]].ts
function toSummary(book) {
  return {
    id: book.id,
    title: book.title,
    description: book.description,
    category: book.category,
    author: book.author,
    pageCount: book.pages.length,
    featured: book.featured,
    published: book.published,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    coverUrl: book.cover.url
  };
}
__name(toSummary, "toSummary");
var onRequestGet2 = /* @__PURE__ */ __name(async ({ env, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (rawId) {
    const row = await env.DB.prepare("SELECT data FROM books WHERE id = ?").bind(rawId).first();
    if (!row) return json({ error: "Book not found" }, 404);
    return json({ book: JSON.parse(row.data) });
  }
  const rows = await env.DB.prepare("SELECT data FROM books ORDER BY created_at DESC").all();
  const books = (rows.results ?? []).map((r) => JSON.parse(r.data));
  return json({ books: books.map(toSummary) });
}, "onRequestGet");
var onRequestPost2 = /* @__PURE__ */ __name(async ({ env, request, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isUpdate = Boolean(rawId);
  if (!isAuthed(request)) {
    if (isUpdate) return json({ error: "Unauthorized" }, 401);
    if (!await bootstrapOpen(env)) return json({ error: "Unauthorized" }, 401);
  }
  let draft;
  try {
    draft = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!draft.title || typeof draft.title !== "string" || draft.title.trim().length === 0) {
    return json({ error: "Title is required" }, 400);
  }
  if (!draft.cover || !isAssetUrl(draft.cover.url)) {
    return json({ error: "Cover must be uploaded to the asset store first" }, 400);
  }
  if (!Array.isArray(draft.pages) || draft.pages.some((p) => !isAssetUrl(p.url))) {
    return json({ error: "Pages must be uploaded to the asset store first" }, 400);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const requestedId = typeof draft.id === "string" && /^[a-z0-9-]{1,60}$/.test(draft.id) ? draft.id : void 0;
  const book = {
    id: rawId ?? requestedId ?? slugify(draft.title),
    title: draft.title.trim(),
    description: (draft.description ?? "").trim(),
    category: draft.category?.trim() || void 0,
    author: draft.author?.trim() || void 0,
    cover: draft.cover,
    pages: [...draft.pages].sort((a, b) => a.pageNumber - b.pageNumber),
    featured: Boolean(draft.featured),
    published: Boolean(draft.published),
    createdAt: now,
    updatedAt: now
  };
  if (isUpdate) {
    const existing = await env.DB.prepare("SELECT data FROM books WHERE id = ?").bind(book.id).first();
    if (existing) {
      const prev = JSON.parse(existing.data);
      book.createdAt = prev.createdAt;
    }
  }
  await env.DB.prepare(
    "INSERT INTO books (id, data, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
  ).bind(book.id, JSON.stringify(book), book.createdAt, book.updatedAt).run();
  return json({ book });
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name(async ({ env, request, params }) => {
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!rawId) return json({ error: "Missing book id" }, 400);
  if (!isAuthed(request)) return json({ error: "Unauthorized" }, 401);
  await env.DB.prepare("DELETE FROM books WHERE id = ?").bind(rawId).run();
  await deleteAssetsWithPrefix(env, `books/${rawId}/`);
  return json({ ok: true });
}, "onRequestDelete");
function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "book";
}
__name(slugify, "slugify");

// api/orders/[[id]].ts
var onRequestPatch = /* @__PURE__ */ __name(async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return json({ error: "Missing order id" }, 400);
  if (!isAuthed(request)) return json({ error: "Unauthorized" }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const allowed = ["new", "confirmed", "in-progress", "completed", "cancelled"];
  if (!body.status || !allowed.includes(body.status)) {
    return json({ error: "Invalid status" }, 400);
  }
  const row = await env.DB.prepare("SELECT data FROM orders WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Order not found" }, 404);
  const order = JSON.parse(row.data);
  order.status = body.status;
  await env.DB.prepare("UPDATE orders SET status = ?, data = ? WHERE id = ?").bind(body.status, JSON.stringify(order), id).run();
  return json({ order });
}, "onRequestPatch");
var onRequestDelete2 = /* @__PURE__ */ __name(async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return json({ error: "Missing order id" }, 400);
  if (!isAuthed(request)) return json({ error: "Unauthorized" }, 401);
  await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
  return json({ ok: true });
}, "onRequestDelete");

// api/styles/[[id]].ts
var onRequestPut = /* @__PURE__ */ __name(async ({ env, request, params }) => {
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!id) return json({ error: "Missing style id" }, 400);
  if (!isAuthed(request)) {
    if (!await bootstrapOpen(env)) return json({ error: "Unauthorized" }, 401);
  }
  let style;
  try {
    style = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const record = {
    id,
    name: style.name ?? "",
    description: style.description ?? "",
    imageUrl: style.imageUrl ?? null,
    enabled: style.enabled !== false
  };
  await env.DB.prepare("INSERT INTO styles (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data").bind(id, JSON.stringify(record)).run();
  return json({ style: record });
}, "onRequestPut");

// api/health.ts
var onRequestGet3 = /* @__PURE__ */ __name(async ({ env }) => {
  const seeded = await getSetting(env, "seeded") === "1";
  return Response.json({ ok: true, seeded });
}, "onRequestGet");

// api/orders.ts
var onRequestGet4 = /* @__PURE__ */ __name(async ({ env, request }) => {
  if (!isAuthed(request)) return json({ error: "Unauthorized" }, 401);
  const rows = await env.DB.prepare("SELECT data FROM orders ORDER BY created_at DESC").all();
  const orders = (rows.results ?? []).map((r) => JSON.parse(r.data));
  return json({ orders });
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name(async ({ env, request }) => {
  let order;
  try {
    order = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!order.id || typeof order.id !== "string" || !order.customer?.name) {
    return json({ error: "Invalid order" }, 400);
  }
  const record = {
    ...order,
    status: "new",
    createdAt: order.createdAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.DB.prepare("INSERT INTO orders (id, status, data, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING").bind(record.id, record.status, JSON.stringify(record), record.createdAt).run();
  return json({ order: record });
}, "onRequestPost");

// api/seed.ts
var onRequestPost4 = /* @__PURE__ */ __name(async ({ env, request }) => {
  const open = await bootstrapOpen(env);
  if (!open && !isAuthed(request)) return json({ error: "Unauthorized" }, 401);
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind("seeded", "1").run();
  return json({ ok: true, seeded: true });
}, "onRequestPost");

// api/styles.ts
var onRequestGet5 = /* @__PURE__ */ __name(async ({ env }) => {
  const rows = await env.DB.prepare("SELECT data FROM styles").all();
  const styles = (rows.results ?? []).map((r) => JSON.parse(r.data));
  return json({ styles });
}, "onRequestGet");

// ../.wrangler/tmp/pages-S4lIvm/functionsRoutes-0.6294740086079972.mjs
var routes = [
  {
    routePath: "/api/assets/:key*",
    mountPath: "/api/assets",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/assets/:key*",
    mountPath: "/api/assets",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/books/:id*",
    mountPath: "/api/books",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/books/:id*",
    mountPath: "/api/books",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/books/:id*",
    mountPath: "/api/books",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/orders/:id*",
    mountPath: "/api/orders",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/orders/:id*",
    mountPath: "/api/orders",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/api/styles/:id*",
    mountPath: "/api/styles",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/orders",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/orders",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/seed",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/styles",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  }
];

// ../../../Users/digim/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../Users/digim/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
