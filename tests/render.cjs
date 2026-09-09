// Lightweight offline DOM contract tests. Fixtures never enter HeraclitusDB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class E {
  constructor(tag='div') { this.tag=tag; this.children=[]; this.value=''; this.classList={toggle(){}}; this.open=false; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children=nodes; }
  setAttribute() {}
  removeAttribute() {}
  showModal() { this.open=true; }
  close() { this.open=false; }
  set innerHTML(_) { throw new Error('Unsafe innerHTML'); }
}
const nodes = new Map();
const document = {querySelector(s){if(!nodes.has(s))nodes.set(s,new E());return nodes.get(s);},createElement(t){return new E(t);},createElementNS(ns,t){return new E(t);},querySelectorAll(){return [];}};
const context = vm.createContext({document,location:{hash:''},window:{addEventListener(){}},setInterval(){},setTimeout(){},URLSearchParams,TextEncoder,performance,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js/soc.js'),'utf8') + '\nthis.test={rowsOf,table,element,render,setPage:(page,value)=>{active=page;data=value;}};', context);
const t=context.test;
assert.equal(t.rowsOf({events:[{id:1}]}).length,1);
assert.equal(t.rowsOf({incidents:[]}).length,0);
assert.equal(t.rowsOf({error:'not available'}).length,0);
const parent=new E();
t.table(parent,[{id:'<img src=x onerror=alert(1)>',severity:9}]);
const flat=(e)=>[e,...(e.children||[]).flatMap(flat)];
assert(flat(parent).some(e=>e.textContent==='<img src=x onerror=alert(1)>'));
assert(!flat(parent).some(e=>e.tag==='img'));
document.querySelector('#search').value='not-present';
const filtered=new E();t.table(filtered,[{id:'abc'}]);
assert(flat(filtered).some(e=>e.textContent==='Nenhum registro neste filtro'));
t.setPage('overview',{head:0,memtable:0,text_indexed:0});t.render();
assert(flat(document.querySelector('#view')).some(e=>e.textContent==='Banco novo: log vazio'));
t.setPage('events',null);t.render();
assert(flat(document.querySelector('#view')).some(e=>e.textContent==='Aguardando consulta'));
console.log('7 DOM contracts passed: shapes, empty/error states, filtering and escaped untrusted data');
document.querySelector('#search').value='';
t.setPage('events',{events:[{id:'a',observed_at:1700000000000},{id:'b',observed_at:1700086400000},{id:'undated'}]});t.render();
const timelineNodes=flat(document.querySelector('#view'));
const sliders=timelineNodes.filter(e=>e.type==='range');
assert.equal(sliders.length,2);
sliders[0].value='1';sliders[0].oninput();
assert.equal(sliders[1].value,'1');
sliders[1].value='0';sliders[1].oninput();
assert.equal(sliders[0].value,'0');
assert(timelineNodes.some(e=>e.textContent==='1 registros sem data reconhecida'));
console.log('Timeline contracts passed: numeric source dates, A/B crossing, undated evidence retained');
