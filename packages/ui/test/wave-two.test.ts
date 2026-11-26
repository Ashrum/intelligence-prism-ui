import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calendar, DatePicker, Editable, FileUpload, ResizableHandle, ResizablePanel, ResizablePanelGroup,
  TagsInput, VirtualList, appendTags, filterSelectedFiles, formatDatePickerValue, matchesFileAccept,
  useVirtualList, type DateRange,
} from "@ole/ui";

test("Wave 2 components and hook are available from the public ESM entry", () => {
  for (const component of [
    Calendar, DatePicker, Editable, FileUpload, ResizableHandle, ResizablePanel, ResizablePanelGroup,
    TagsInput, VirtualList, useVirtualList,
  ]) assert.equal(typeof component, "function");
});

test("Calendar defaults to Chinese and Monday, with a configurable week start", () => {
  const month = new Date(2026, 8, 1);
  const html = renderToStaticMarkup(createElement(Calendar, { mode: "single", defaultMonth: month }));
  const sundayStart = renderToStaticMarkup(createElement(Calendar, { mode: "single", defaultMonth: month, weekStartsOn: 0 }));
  assert.match(html, /2026年9月/);
  assert.match(html, /上个月/);
  assert.match(html, /星期一/);
  assert.ok(html.indexOf("星期一") < html.indexOf("星期日"));
  assert.ok(sundayStart.indexOf("星期日") < sundayStart.indexOf("星期一"));
});

test("Virtual list makes the initial scroll snapshot available before a viewport mounts", () => {
  function SnapshotProbe() {
    const { getScrollSnapshot } = useVirtualList({ count: 0, estimateSize: 32, initialScrollSnapshot: { offset: 140, measurements: [] } });
    return createElement("span", null, JSON.stringify(getScrollSnapshot()));
  }
  const html = renderToStaticMarkup(createElement(SnapshotProbe));
  assert.match(html, /offset&quot;:140/);
  assert.match(html, /measurements&quot;:\[\]/);
});

test("DatePicker formatting handles empty, partial, and complete selections", () => {
  const from = new Date(2026, 8, 15);
  const to = new Date(2026, 8, 21);
  const range: DateRange = { from, to };
  assert.equal(formatDatePickerValue(undefined), "");
  assert.equal(formatDatePickerValue({ from, to: undefined }), "2026年9月15日");
  assert.equal(formatDatePickerValue(range), "2026年9月15日 – 2026年9月21日");
  assert.equal(formatDatePickerValue(from, "en-US"), "Sep 15, 2026");
  assert.equal(formatDatePickerValue(new Date("2026-09-15T00:00:00Z"), "zh-CN", "America/Los_Angeles"), "2026年9月14日");
});

test("Tags are trimmed, deduplicated, and capped without losing existing tags", () => {
  const current = Object.freeze(["Alpha"]);
  assert.deepEqual(appendTags(current, ["", " Alpha ", " Beta ", "Beta", "Gamma"], 2), ["Alpha", "Beta"]);
  assert.deepEqual(appendTags(current, ["Beta"], 0), ["Alpha"]);
  assert.deepEqual(appendTags([], ["Second", "First", "Second"]), ["Second", "First"]);
});

test("File accept matching uses native extension, exact MIME, and wildcard conventions", () => {
  assert.ok(matchesFileAccept({ name: "NOTES.TXT", type: "" }, " .txt, image/* "));
  assert.ok(matchesFileAccept({ name: "scan", type: "image/png" }, "image/*"));
  assert.ok(matchesFileAccept({ name: "scan", type: "application/pdf" }, "APPLICATION/PDF"));
  assert.ok(matchesFileAccept({ name: "scan", type: "" }));
  assert.equal(matchesFileAccept({ name: "photo.png.exe", type: "application/octet-stream" }, ".png,image/*"), false);
});

test("File queue accepts the exact size limit and reports type and size rejections", () => {
  const allowed = new File(["123"], "allowed.txt");
  const tooLarge = new File(["1234"], "too-large.txt");
  const wrongType = new File(["1"], "wrong.csv");
  assert.deepEqual(filterSelectedFiles([allowed, tooLarge, wrongType], ".txt", 3), {
    accepted: [allowed],
    rejected: [{ file: tooLarge, reason: "size" }, { file: wrongType, reason: "accept" }],
  });
});
