import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from 'next-themes';
import { themeOptions, themePalette, coreThemes, isBlueprintTheme } from '../lib/prism-next/config.ts';
import { chartSeriesColors, chartShapeColors, chartSequentialDefault, blueprintChartOverrides } from '../lib/prism-next/chart-palette.ts';
import { heatmapShowsCellLabels } from '../lib/prism-next/heatmap-labels.ts';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';
import { capture, heatmapProps } from './p57-chart-harness.mjs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const theme = read('app/(next)/next/theme.css');
const bp = postcss.parse(read('app/(next)/next/blueprint.css'));
const baseline = JSON.parse(read('docs/blueprint/evidence/v9/baseline.json'));
const values = themeOptions.map(t => t.value);
const night = 'blueprint-night';
const body = theme.split(`:where([data-agent-preview])[data-prism-theme="${night}"] {`)[1].split('}')[0];
const tokens = Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1],m[2]]));
const ratio = (a,b) => (Math.max(relativeLuminance(a),relativeLuminance(b))+.05)/(Math.min(relativeLuminance(a),relativeLuminance(b))+.05);

// Parse the production selector with Lightning CSS; evaluate only its supported
// attribute / is / where / not / descendant subset on explicit synthetic trees.
// This proves selector logic, not browser cascade, layout, or visual acceptance.
function parseSelector(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector.replaceAll('&', '.probe')} { color:red }`), visitor: { Selector(s) { ast = s; } } });
  assert.ok(ast); return ast;
}
function matches(selector, node) {
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    assert.equal(selector[split].value, 'descendant');
    if (!matches(selector.slice(split+1), node)) return false;
    for (let p=node.parent;p;p=p.parent) if (matches(selector.slice(0,split),p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'class') return node.classes?.includes(s.name) ?? false;
    if (s.type === 'attribute') {
      if (!s.operation) return Object.hasOwn(node.attrs,s.name);
      assert.equal(s.operation.operator,'equal'); return node.attrs[s.name]===s.operation.value;
    }
    if (s.type === 'pseudo-class') {
      assert.ok(['is','where','not'].includes(s.kind), s.kind);
      const any=s.selectors.some(child=>matches(child,node)); return s.kind==='not'?!any:any;
    }
    assert.fail(`unsupported selector node: ${JSON.stringify(s)}`);
  });
}
const element = (theme, parent, preview=false) => ({parent,classes:['probe'],attrs:{...(theme?{'data-prism-theme':theme}:{}),...(preview?{'data-agent-preview':''}:{})}});

test('configuration registers night after blueprint, palette covers every selectable value', () => {
  assert.equal(new Set(values).size, values.length);
  assert.deepEqual(Object.keys(themePalette), values);
  assert.equal(values.indexOf(night), values.indexOf('blueprint')+1);
  assert.equal(themeOptions.find(t=>t.value===night).label, '夜图');
  assert.deepEqual(coreThemes,['light','paper','dark']);
  for (const t of values) assert.equal(isBlueprintTheme(t), ['blueprint',night].includes(t));
  assert.equal(isBlueprintTheme(undefined),false);
  assert.match(read('components/prism-next/providers.tsx'), /themeOptions.map\(option => option.value\)/);
  assert.match(read('components/prism-next/providers.tsx'), /storageKey="prism-v1-theme"/);
  assert.match(read('components/prism-next/providers.tsx'), /enableColorScheme=\{false\}/);
  assert.match(read('components/prism-next/shell.tsx'), /themeOptions.map\(option=><SelectItem/);
});

test('next-themes initialization restores every old stored value and night on the same attribute/key', () => {
  const html=renderToStaticMarkup(React.createElement(ThemeProvider,{themes:values,attribute:'data-prism-theme',storageKey:'prism-v1-theme',defaultTheme:'light',enableSystem:false,enableColorScheme:false}));
  const script=html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
  for (const saved of [null,...values]) {
    const attrs={}, style={};
    vm.runInNewContext(script,{localStorage:{getItem(key){assert.equal(key,'prism-v1-theme');return saved;}},document:{documentElement:{setAttribute(k,v){attrs[k]=v;},style}}});
    assert.equal(attrs['data-prism-theme'], saved??'light');
    assert.deepEqual(style,{},'CSS owns color-scheme for every theme, including night');
  }
});

test('all original core and white token blocks retain their baseline bytes', () => {
  const blocks=[...theme.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].includes(':where([data-agent-preview]')&&!m[1].includes(`data-prism-theme="${night}"`)).map(m=>m[2]);
  assert.deepEqual(blocks.map(s=>createHash('sha256').update(s).digest('hex')),baseline.themeBlockHashes);
});

test('night maps BP.dark roles, SQUARE geometry, and documented fill fallbacks', () => {
  const expected={background:'#081322',foreground:'#E6EDF7',heading:'#E6EDF7',card:'#0D1C31','card-foreground':'#E6EDF7',popover:'#0D1C31','popover-foreground':'#E6EDF7',primary:'#E6EDF7','primary-foreground':'#081322',secondary:'#12253F','secondary-foreground':'#E6EDF7',muted:'#12253F','muted-foreground':'#A9B8CC',accent:'#16305A','accent-foreground':'#E6EDF7',border:'#23385A',input:'#C9D6E8',ring:'#6EA8FF',link:'#6EA8FF','disabled-foreground':'#7D90AA',destructive:'#FF7070','destructive-foreground':'#FF7070',info:'#6EA8FF','info-foreground':'#6EA8FF',success:'#62BD89','success-foreground':'#7FD6A0',warning:'#E8A33D','warning-foreground':'#F0B14A',sidebar:'#0D1C31',code:'#0A1729','code-bg':'#0A1729','accent-ink':'#081322',line:'#C9D6E8','line-width':'1.5px',radius:'0px','head-bg':'#E6EDF7','head-fg':'#081322',grid:'rgba(201,214,232,.06)','grid-strong':'rgba(201,214,232,.1)','shadow-offset':'4px 4px 0 #6EA8FF','shadow-offset-sm':'2px 2px 0 #6EA8FF'};
  for (const [key,value] of Object.entries(expected)) assert.equal(tokens[`--${key}`],value,key);
  const white=theme.split(':where([data-agent-preview])[data-prism-theme="blueprint"] {')[1].split('}')[0];
  const keys=[...white.matchAll(/(--[\w-]+):/g)].map(m=>m[1]);
  assert.deepEqual(Object.keys(tokens),keys);
  assert.match(body,/color-scheme:dark/);
  for (const [key,value] of Object.entries(themePalette[night])) {
    const alias={surface:'card',muted:'muted-foreground',disabled:'disabled-foreground'};
    assert.equal(tokens[`--${alias[key]??key}`],value,key);
  }
});

const oldDark=parseSelector(baseline.darkSelector);
const dark=parseSelector(theme.match(/@custom-variant dark \((.*)\);/)[1]);
test('dark selector retains original four-theme results for roots and up to two nested preview boundaries', () => {
  const previous=values.filter(t=>t!==night);
  for (const outer of previous) for (const inner of [undefined,...previous]) for (const deep of [undefined,...previous]) {
    const root=element(outer); const preview=element(inner,root,!!inner); const nested=element(deep,preview,!!deep); const child=element(undefined,nested);
    for (const n of [root,preview,nested,child]) assert.equal(matches(dark,n),matches(oldDark,n),`${outer}/${inner}/${deep}`);
  }
});
test('night dark utilities include root/descendants and dark-night nesting; light/paper/white previews are excluded', () => {
  for (const outer of values) {
    const root=element(outer); const preview=element(night,root,true);
    for (const n of [preview,element(undefined,preview)]) assert.equal(matches(dark,n),true,outer);
  }
  for (const outer of ['dark',night]) for (const inner of values) {
    const root=element(outer); assert.equal(matches(dark,root),true);
    const preview=element(inner,root,true);
    for (const n of [preview,element(undefined,preview)]) assert.equal(matches(dark,n),['dark',night].includes(inner),`${outer}/${inner}`);
  }
});

test('all shared Blueprint rules expand theme and guards, including pseudo-elements; night-only colours exclude white previews', () => {
  const shared=':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
  const guard=`:not(:where([data-agent-preview][data-prism-theme]:not(${shared}), [data-agent-preview][data-prism-theme]:not(${shared}) *))`;
  const nightGuard=':not(:where([data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint-night"]), [data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint-night"]) *))';
  bp.walkRules(rule=>{
    for (const s of rule.selectors) {
      if (s.startsWith('.bp-')) continue;
      if (s === `:where(html${shared}) body`) continue;
      const g=s.includes(guard)?guard:nightGuard;
      assert.ok(s.includes(g),s);
      if (s.includes('::')) assert.ok(s.indexOf(g)<s.indexOf('::'),s);
      if (g===guard) assert.ok(s.slice(0,s.indexOf(g)).includes(shared),s);
    }
  });
  const accept=parseSelector(`.probe${guard}`), nightAccept=parseSelector(`.probe${nightGuard}`);
  for (const outer of values) for (const inner of values) {
    const preview=element(inner,element(outer),true);
    for (const n of [preview,element(undefined,preview)]) {
      assert.equal(matches(accept,n),isBlueprintTheme(inner),`${outer}/${inner}`);
      assert.equal(matches(nightAccept,n),inner===night,`${outer}/${inner}`);
    }
  }
});

test('night charts use core dark colours/ramp with Blueprint geometry, patterns and night tooltip ink/shadow', () => {
  assert.deepEqual(chartSeriesColors(night),chartSeriesColors('dark'));
  assert.deepEqual(chartShapeColors(night),chartShapeColors('dark'));
  assert.deepEqual(chartSequentialDefault(night,themePalette[night].secondary),chartSequentialDefault('dark',themePalette[night].secondary));
  const opts=blueprintChartOverrides(night);
  assert.deepEqual(opts.aria,blueprintChartOverrides('blueprint').aria);
  assert.equal(opts.tooltip.borderColor,'#C9D6E8'); assert.equal(opts.tooltip.shadowColor,'#6EA8FF');
  assert.equal(opts.tooltip.borderRadius,0); assert.equal(opts.tooltip.borderWidth,1.5);
  chartSeriesColors(night).slice(0,5).forEach((color,i)=>assert.equal(tokens[`--chart-${i+1}`],color));
  assert.equal(themePalette[night].line,'#C9D6E8');
});

test('night heatmap follows BPv6 width/disclosure rule and retains zero/missing tooltip/table facts', () => {
  for (const width of [undefined,0,320,399.5,400,1280]) {
    assert.equal(heatmapShowsCellLabels(width,'visible',night),width===undefined||width>=400);
    assert.equal(heatmapShowsCellLabels(width,'hidden',night),true);
  }
  const out=capture('HeatmapChart',heatmapProps,night);
  assert.equal(out.charts[0].option.series[0].label.show,true,'SSR unknown width');
  assert.equal(out.charts[0].preserveItemTooltip,true);
  assert.equal(out.charts[0].option.tooltip.formatter({data:out.charts[0].option.series[0].data[0]}),'长中文行 · 列一\n0');
  assert.match(out.html,/缺测/);
});

test('night WCAG text/status and non-text UI contrast on page/card; failures are explicit and design values stay fixed', () => {
  const result={};
  const roles=['foreground','muted-foreground','link','destructive-foreground','info-foreground','success-foreground','warning-foreground','destructive','info','success','warning','ring','line','border'];
  const exceptions=[];
  for (const role of roles) {
    const threshold=['foreground','muted-foreground','link'].includes(role)||role.endsWith('-foreground')?4.5:3;
    result[role]=Object.fromEntries(['background','card'].map(bg=>{
      const value=ratio(tokens[`--${role}`],tokens[`--${bg}`]);
      if (value<threshold) exceptions.push(`${role}/${bg}`);
      return [bg,{ratio:value,threshold,pass:value>=threshold}];
    }));
  }
  assert.deepEqual(exceptions,['border/background','border/card'],'decorative separator is not the control ink line');
  assert.equal(ratio('#000000','#FFFFFF'),21);
  if (process.env.BPV9_EVIDENCE_DIR) writeFileSync(`${process.env.BPV9_EVIDENCE_DIR}/contrast.json`,JSON.stringify(result,null,2)+'\n');
});
