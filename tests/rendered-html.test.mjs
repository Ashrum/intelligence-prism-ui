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

test("renders the finalized Button surfaces and removes the review route", async () => {
  const [button, benchmark, review] = await Promise.all([
    fetchPage("/components/button"),
    fetchPage("/benchmark"),
    fetchPage("/review/button"),
  ]);

  assert.equal(button.status, 200);
  assert.equal(benchmark.status, 200);
  assert.equal(review.status, 404);

  const buttonHtml = await button.text();
  assert.match(buttonHtml, /<title>Button｜智能曜彩<\/title>/i);
  assert.match(buttonHtml, /七种操作层级/);
  assert.match(buttonHtml, /未传等待文案/);
  assert.match(buttonHtml, /空字符串等待文案/);
  assert.match(buttonHtml, /纯空白等待文案/);

  const benchmarkHtml = await benchmark.text();
  assert.match(benchmarkHtml, /智能曜彩｜基础组件基准/);
  assert.match(benchmarkHtml, /data-variant="ai-primary"/);
});

test("renders the isolated Tabs review without changing formal routes", async () => {
  const [review, tabs, segmented, benchmark] = await Promise.all([
    fetchPage("/review/tabs"),
    fetchPage("/components/tabs"),
    fetchPage("/components/segmented-control"),
    fetchPage("/benchmark"),
  ]);

  assert.equal(review.status, 200);
  assert.equal(tabs.status, 200);
  assert.equal(segmented.status, 200);
  assert.equal(benchmark.status, 200);

  const reviewHtml = await review.text();
  assert.match(reviewHtml, /Tabs 与 Segmented Control/);
  assert.match(reviewHtml, /Page Tabs/);
  assert.match(reviewHtml, /Surface Tabs/);
  assert.match(reviewHtml, /Segmented Control/);
  assert.match(reviewHtml, /窄容器与长标签/);
  assert.match(reviewHtml, /长标签与禁用项/);
  assert.match(reviewHtml, /Tabs 评审/);
});
