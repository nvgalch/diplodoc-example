"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extension = void 0;

const { ok } = require("node:assert");
const path = require("node:path");
const { getBuildHooks, getEntryHooks } = require("@diplodoc/cli");

class Extension {
  apply(program) {
    getBuildHooks(program)
      .BeforeRun.for("html")
      .tap("Breadcrumbs", (run) => {
        if (!program.config.breadcrumbs) return;

        // Нормализация и валидация конфига (вместо getHooks(program).Config.tap)
        const raw = program.config.breadcrumbs;
        ok(raw === true || typeof raw === "object", "breadcrumbs must be object or true");

        const options = Object.assign(
          { tocAsRoot: true, appendLabeled: false },
          raw === true ? {} : raw,
        );

        ok(typeof options.tocAsRoot === "boolean", "breadcrumbs.tocAsRoot must be boolean type");
        ok(typeof options.appendLabeled === "boolean", "breadcrumbs.appendLabeled must be boolean type");

        // чтобы дальше в коде всегда был объект
        program.config.breadcrumbs = options;

        const tocService = run.toc;
        const breadcrumbCacheMap = new Map();

        getEntryHooks(run.entry).State.tap("Breadcrumbs", (state) => {
          const toc = tocService.for(state.router.pathname);
          if (!toc.items || toc.items.length === 0) return state;

          const breadcrumbsMap = getBreadcrumbsMap(toc, options, breadcrumbCacheMap);

          // NB: в исходнике было join(pathname, base) — это странно, но оставляю логику максимально близкой
          const rootPath = path.join(state.router.pathname, state.router.base);
          const pathname = state.router.pathname.replace(rootPath, "");

          if (!breadcrumbsMap.has(pathname)) return state;

          state.data.breadcrumbs = breadcrumbsMap.get(pathname).map((item) =>
            item.url && !isExternalHref(item.url)
              ? { ...item, url: path.join(rootPath, item.url) + ".html" }
              : item,
          );

          return state;
        });
      });
  }
}
exports.Extension = Extension;

// ---- helpers (замена @diplodoc/cli/lib/utils) ----

function isExternalHref(href) {
  // внешние: http(s), mailto, tel, protocol-relative, data, etc.
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href) || href.startsWith("//");
}

function setExt(href, ext) {
  // ext = "" в твоём коде означает "убрать расширение"
  // сохраняем query/hash
  const m = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const base = m?.[1] ?? href;
  const query = m?.[2] ?? "";
  const hash = m?.[3] ?? "";

  const withoutExt = base.replace(/\.[^/.]+$/, "");
  return `${withoutExt}${ext}${query}${hash}`;
}

// ---- original logic ----

function getBreadcrumbsMap(toc, config, breadcrumbCacheMap) {
  if (!breadcrumbCacheMap.has(toc.path)) {
    breadcrumbCacheMap.set(toc.path, createBreadcrumbsMap(toc, config));
  }
  return breadcrumbCacheMap.get(toc.path);
}

function createBreadcrumbsMap(toc, options) {
  const breadcrumbsMap = new Map();

  function processItem(item, currentPath) {
    const breadcrumbItem = { name: item.name };

    if (item.href) {
      breadcrumbItem.url = setExt(item.href, "");
    }

    if (breadcrumbItem.url) {
      breadcrumbsMap.set(breadcrumbItem.url, [...currentPath, breadcrumbItem]);
    }

    if (item.items?.length > 0) {
      const breadcrumbItems =
        !options.appendLabeled && item.labeled && !breadcrumbItem.url
          ? [...currentPath]
          : [...currentPath, breadcrumbItem];

      item.items.forEach((child) => processItem(child, breadcrumbItems));
    }
  }

  const initialBreadcrumbItems =
    options.tocAsRoot && toc.title && toc.href ? [{ name: toc.title, url: toc.href }] : [];

  toc.items.forEach((item) => processItem(item, initialBreadcrumbItems));
  return breadcrumbsMap;
}