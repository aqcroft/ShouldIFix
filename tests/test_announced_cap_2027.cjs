'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const engine=fs.readFileSync('cap-rates-20261127.js','utf8');
const close=(a,b,message)=>assert(Math.abs(a-b)<1e-8,`${message}: ${a} vs ${b}`);
function context(file,search='?cr=20261127'){
 const elements={region:{value:'11'},janRise:{value:'28.8'},forecastDefault:{value:'28.8'}};
 const c={URLSearchParams,URL,console,location:{search,origin:'https://example.test',pathname:'/Oct2026.html'},
  document:{getElementById:id=>elements[id]||(elements[id]={value:'',checked:false,getAttribute:()=>null}),
   querySelector:()=>({dataset:{mode:'dual'}})},setTimeout:()=>0,clearTimeout:()=>{}};
 c.window=c;vm.createContext(c);vm.runInContext(engine,c);
 const html=fs.readFileSync(file,'utf8');
 const main=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].find(m=>m[2].includes('const REGIONS ='))[2];
 vm.runInContext(main.slice(0,main.indexOf('/* ---- init ---- */')),c);
 return {c,e:s=>vm.runInContext(s,c)};
}
test('all 14 regions have four finite published cap components',()=>{
 const c={URLSearchParams};vm.runInNewContext(engine,c);const d=c.Cap2027.data;
 assert.equal(Object.keys(d.january).length,14);
 for(let n=10;n<=23;n++)for(const k of ['eU','eSC','gU','gSC'])assert(d.january[n][k]>0);
 assert.deepEqual(JSON.parse(JSON.stringify(d.january[11])),{eU:31.65,eSC:51.38,gU:10.81,gSC:29.37});
 assert.deepEqual(JSON.parse(JSON.stringify(d.january[12])),{eU:33.08,eSC:42.88,gU:11.14,gSC:30.19});
 assert.deepEqual(JSON.parse(JSON.stringify(d.january[23])),{eU:32.11,eSC:61.59,gU:10.89,gSC:29.73});
});
for(const file of ['Oct2026.html','renewal-builder-v1.html']){
 test(file+' uses exact January rates in every region and preserves October',()=>{
  const {e}=context(file);
  assert.equal(e('DEFAULT_JAN_RISE'),25.7);
  assert.equal(e('latestCapModel()'),true);
  assert(e("REGIONS.every(r=>Object.keys(r.cap.octdec).every(k=>projectedCapRate(r,'conf',25.7)[k]===r.cap.octdec[k]))"));
  assert(e("REGIONS.every(r=>Object.keys(Cap2027.data.january[r.n]).every(k=>projectedCapRate(r,'jan',25.7)[k]===Cap2027.data.january[r.n][k]))"));
  assert.equal(e("phaseForecastLabel('jan',25.7)"),'Confirmed');
  assert.match(e("phaseForecastLabel('apr',25.7)"),/forecast/);
 });
 test(file+' default percentage and unit modes give identical rates in all quarters',()=>{
  const {e}=context(file);const before=e("['jan','apr','jul','flat'].map(p=>projectedCapRate(REGIONS[1],p,25.7))");
  e("forecastScenarioMode='unit'");const after=e("['jan','apr','jul','flat'].map(p=>projectedCapRate(REGIONS[1],p,25.7))");
  for(let i=0;i<4;i++)for(const k of ['eU','gU','eSC','gSC'])close(before[i][k],after[i][k],k);
  e('forecastGasUnit=12');const gas=e("projectedCapRate(REGIONS[1],'jul',25.7)");
  close(gas.eU,after[2].eU,'gas stress leaves electricity unchanged');assert(gas.gU>after[2].gU);
 });
 test(file+' weighted partial-month costs match independent arithmetic',()=>{
  const {e}=context(file);
  e("MONTHS=[{k:'Jan',id:'2027-01',cal:0,year:2027,ph:'jan',days:15,fullDays:31}]");
  const result=e("compute({region:REGIONS[1],elecY:3000,gasY:12000,mode:'dual',fix:{eSC:50,eU:28,gSC:20,gU:9},disc:0,janRise:25.7,electricHeat:false})");
  const weights=e('({e:ELEC_W[0],g:GAS_W[0]})');
  const expected=(31.65*3000*weights.e*15/31+51.38*15+10.81*12000*weights.g*15/31+29.37*15)/100;
  close(result.yCap,expected,'actual days and seasonal usage');
  close(result.ySave,result.yCap-result.yFix,'savings');
 });
 test(file+' electricity VAT boundary is July and renewal rates are not replaced with cap',()=>{
  const {e}=context(file);
  assert.equal(e('elecVAT({year:2027,cal:5})'),0);assert.equal(e('elecVAT({year:2027,cal:6})'),.05);
  const r=e("renewalVariableRate({eU:20,eSC:40,gU:7,gSC:25},'jan',25.7)");
  close(r.eU,20*31.65/25.36,'customer rate proportional uplift');
  close(r.gSC,25*29.37/29.41,'customer standing charge proportional uplift');
 });
 test(file+' legacy links retain previous defaults and tax boundary',()=>{
  const {e}=context(file,'?r=11&e=3000&g=12000');
  assert.equal(e('latestCapModel()'),false);assert.equal(e('DEFAULT_JAN_RISE'),28.8);
  assert.equal(e('elecVAT({year:2027,cal:3})'),.05);
 });
 test(file+' embedded scripts parse',()=>{
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/src=|ld\+json/.test(m[1]))new vm.Script(m[2]);
 });
}
test('future national model matches annual forecast ratios and applies July VAT once',()=>{
 const c={URLSearchParams};vm.runInNewContext(engine,c);const m=c.Cap2027;
 close(m.annual(m.nationalApr)/m.annual(m.data.national),2222/2166,'April annual endpoint');
 close(m.annual(m.nationalJul)/m.annual(m.nationalApr),2034/2222,'July annual endpoint');
 close(m.nationalApr.eSC,m.data.national.eSC,'April standing fixed');
 close(m.nationalJul.eSC,m.data.national.eSC*1.05,'July VAT once');
 close(m.nationalJul.gSC,m.data.national.gSC,'gas standing fixed');
});
