import test from 'node:test';
import assert from 'node:assert/strict';
import { filterMaterials, materialRows, setMaterialStatus } from '../lib/prism-next/material-table.ts';

test('table filters combine status and trimmed title, subject or stable ID queries',()=>{
  assert.equal(filterMaterials(materialRows,' M-001 ','all')[0]?.id,'M-001');
  assert.equal(filterMaterials(materialRows,'m-001','reviewed').length,0);
  assert.ok(filterMaterials(materialRows,'物理','pending').every(row=>row.subject==='物理'&&row.status==='pending'));
  assert.equal(filterMaterials(materialRows,'不存在的材料','all').length,0);
});
test('batch updates follow stable IDs across filtered and reordered rows without mutating source',()=>{
  const ordered=[...materialRows].reverse();
  const before=structuredClone(ordered);
  const updated=setMaterialStatus(ordered,['M-001','M-009'],'reviewed');
  assert.equal(updated.find(row=>row.id==='M-001').status,'reviewed');
  assert.equal(updated.find(row=>row.id==='M-009').status,'reviewed');
  for(const row of updated.filter(row=>!['M-001','M-009'].includes(row.id))) assert.deepEqual(row,before.find(other=>other.id===row.id));
  assert.deepEqual(ordered,before);
  assert.equal(filterMaterials(updated,'','pending').length,filterMaterials(before,'','pending').length-2);
});
