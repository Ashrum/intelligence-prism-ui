import assert from "node:assert/strict";
import test from "node:test";

const siteTitle = /<title>智能曜彩 UI Design System<\/title>/i;
const siteDescription =
  /<meta(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["']智能曜彩 UI Design System 的 Foundations、组件目录与交互基准站点。["'])[^>]*>/i;

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href);

async function fetchPage(pathname) {
  const { default: worker } = await workerPromise;
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the component library metadata", async () => {
  const response = await fetchPage("/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, siteTitle);
  assert.match(html, siteDescription);
});

test("renders the Foundations and catalog routes", async () => {
  const [foundations, catalog] = await Promise.all([
    fetchPage("/foundations/color"),
    fetchPage("/components"),
  ]);

  assert.equal(foundations.status, 200);
  assert.equal(catalog.status, 200);
  assert.match(await foundations.text(), /<title>色彩｜智能曜彩<\/title>/i);
  assert.match(await catalog.text(), /<title>组件总览｜智能曜彩<\/title>/i);
});
