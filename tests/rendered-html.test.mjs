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

test("renders finalized Tabs and Segmented surfaces and removes the review route", async () => {
  const [review, tabs, segmented, benchmark] = await Promise.all([
    fetchPage("/review/tabs"),
    fetchPage("/components/tabs"),
    fetchPage("/components/segmented-control"),
    fetchPage("/benchmark"),
  ]);
  assert.equal(review.status, 404);
  for (const response of [tabs, segmented, benchmark]) assert.equal(response.status, 200);
  const tabsHtml = await tabs.text();
  assert.match(tabsHtml, /Page Tabs/);
  assert.match(tabsHtml, /Surface Tabs/);
  assert.match(tabsHtml, /跨学科学习过程长期趋势/);
  assert.match(tabsHtml, /归档记录不可用：当前用户没有查看权限/);
  const segmentedHtml = await segmented.text();
  assert.match(segmentedHtml, /按学生成长证据组织/);
  assert.match(segmentedHtml, /role="radiogroup"/);
  for (const html of [tabsHtml, segmentedHtml, await benchmark.text()]) {
    assert.match(html, /data-selection-indicator/);
    assert.doesNotMatch(html, /Tabs 评审|data-review-indicator|href="\/review\/tabs"/);
  }
});

test("renders the OpenUI review pilot across the production RSC boundary", async () => {
  const response = await fetchPage("/review/openui");
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of ["证据解释与复核", "固定样例", "人工复核", "结论的局限", "18 / 22"]) assert.ok(html.includes(text));
  assert.match(html, /id="review-draft"/);
  assert.match(html, /生成新初稿/);
});
