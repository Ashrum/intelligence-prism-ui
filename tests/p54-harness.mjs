import { api, h, render, capture } from './review-components-harness.mjs';
import { api as records, capture as captureRecord, click } from './record-list-harness.mjs';
export { api, h, render, capture, records, captureRecord, click };
const noop = () => {};
export const mixed = { viewportRef: { current: null }, pages: [{ id: 'digital', width: 794, height: 1, content: h('article', {}, '长中文数字题面') }, { id: 'scan', width: 600, height: 820, alt: '扫描作答' }], zoom: 'width', rotations: {}, selected: '', scale: 1, activePage: 'scan', topInset: 0, headers: {}, answerLabel: '学生作答', onSelect: noop, onZoom: noop, onVisiblePage: noop, onViewport: noop };
export const digital = { ...mixed, pages: [mixed.pages[0]] };
export const preview = props => render(h(api.PaperPreview, { layout: 'mixed', mixed: props }));
export function baselineCases() {
  return {
    mixed: preview(mixed),
    mixedRotated: preview({ ...mixed, zoom: 175, rotations: { scan: 90 } }),
    scan: preview({ ...mixed, pages: [mixed.pages[1]] }),
    missingScan: preview({ ...mixed, pages: [...mixed.pages, { id: 'missing', width: 794, height: 1123 }] }),
    continuous: render(h(api.PaperPreview, { pages: [{ id: 'scan', dimensions: { width: 794, height: 1123 } }] })),
    empty: preview({ ...mixed, pages: [] }),
    digital: preview(digital),
    records: captureRecord().html,
    markedRecords: captureRecord({ tabs: [], rows: records.markedRecordRows }).html,
    noMenuRecords: captureRecord({ tabs: [], rows: records.recordRows.slice(0, 2).map(row => ({ ...row, menu: undefined })) }).html,
  };
}
