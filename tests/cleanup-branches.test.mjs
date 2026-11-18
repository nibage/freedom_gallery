import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldDelete } from '../scripts/cleanup-merged-branches.mjs';

const repo='nibage/freedom_gallery';
const pr={
  merged_at:'2026-11-18T10:00:00Z',
  base:{ref:'main'},
  head:{ref:'feature/finished',sha:'abc123',repo:{full_name:repo}}
};
const branch={name:'feature/finished',protected:false,commit:{sha:'abc123'}};

test('only an unchanged, merged, same-repo branch is eligible',()=>{
  assert.equal(shouldDelete(pr,branch,new Set(),repo),true);
  assert.equal(shouldDelete({...pr,merged_at:null},branch,new Set(),repo),false);
  assert.equal(shouldDelete({...pr,head:{...pr.head,repo:{full_name:'someone/other'}}},branch,new Set(),repo),false);
  assert.equal(shouldDelete(pr,{...branch,protected:true},new Set(),repo),false);
  assert.equal(shouldDelete(pr,{...branch,commit:{sha:'newwork'}},new Set(),repo),false);
  assert.equal(shouldDelete(pr,branch,new Set(['feature/finished']),repo),false);
  assert.equal(shouldDelete({...pr,head:{...pr.head,ref:'main'}},{...branch,name:'main'},new Set(),repo),false);
  assert.equal(shouldDelete({...pr,head:{...pr.head,ref:'personal'}},{...branch,name:'personal'},new Set(),repo),false);
});
