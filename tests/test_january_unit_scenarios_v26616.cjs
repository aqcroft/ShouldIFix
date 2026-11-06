'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const close=(a,b,description)=>assert(Math.abs(a-b)<1e-10,description+': '+a+' != '+b);
for(const filename of ['Oct2026.html','renewal-builder-v1.html']){
 test(filename+' inline JavaScript parses; reference buttons and share paths retained',()=>{
   const html=read(filename);
   for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
     if(/\bsrc\s*=|ld\+json/.test(m[1])||!m[2].trim())continue;
     new vm.Script(m[2],{filename});
   }
   assert.match(html,/function forecastDefaultUnitRates\(\)/);
   assert.match(html,/function forecastCurrentUnitRates\(\)/);
   assert.match(html,/function activateForecastMethod\(mode\)/);
   assert.match(html,/\[15,20,25,DEFAULT_JAN_RISE,30,35\]/);
   assert.match(html,/forecastScenarioMode='percent',forecastGasUnit=null,forecastElecUnit=null/);
   assert.match(html,/forecastGasUnit===null\?reference\.gas:forecastGasUnit/);
   assert.match(html,/forecastElecUnit===null\?reference\.elec:forecastElecUnit/);
   assert.match(html,/p\.set\('um','1'\)/);
   assert.match(html,/forecastCurrentUnitRates\(\).*p\.set\('ue',rates\.elec\)/);
   assert.match(html,/if\(P\.has\('ug'\).*Number\.isFinite/);
   assert.match(html,/if\(P\.has\('ue'\).*Number\.isFinite/);
 });
 test(filename+' forecast methods are equivalent and independent across every quarter',()=>{
   const html=read(filename);
   const start=html.indexOf('let forecastScenarioMode=');
   const controls=html.slice(start,html.indexOf('/* Forecast split:',start));
   const model=html.slice(html.indexOf('const forecastStepCache=new Map();'),html.indexOf('/* ---------- EV / ECONOMY 7 EXTENSION ---------- */'));
   assert(controls.length>0&&model.length>0);
   const page={fuel:'dual',jan:'28.8'};
   const scope={Map,Math,Number,window:{},render:()=>{},
     document:{querySelector:()=>({dataset:{mode:page.fuel}}),getElementById:()=>({value:page.jan})},
     forecastScenarioValues:()=>[15,20,25,28.8,30,35],
     REGIONS:[{cap:{octdec:{eSC:50,eU:26,gSC:30,gU:8},julsep:{eSC:48,eU:25,gSC:28,gU:7}}}],
     FORECAST_MED_E:2500,FORECAST_MED_G:9500,FORECAST_E_SHAPE:7.6,FORECAST_G_SHAPE:12.2,
     DEFAULT_JAN_RISE:28.8,APR_FROM_JAN:1.064,JUL_FROM_APR:0.907};
   vm.runInNewContext(controls+model,scope);
   const e=expression=>vm.runInNewContext(expression,scope);
   let pct=e('forecastSteps(DEFAULT_JAN_RISE)');
   const defaultRates=e('forecastDefaultUnitRates()');
   close(defaultRates.elec/26,pct.jan.e,'Jan electricity equivalent');
   close(defaultRates.gas/8,pct.jan.g,'Jan gas equivalent');
   const percentHtml=e('forecastControlMarkup(DEFAULT_JAN_RISE)');
   assert.match(percentHtml,/15%/);assert.match(percentHtml,/20%/);assert.match(percentHtml,/25%/);
   assert.match(percentHtml,/\+28\.8%/);assert.match(percentHtml,/\+30%/);assert.match(percentHtml,/\+35%/);
   assert.match(percentHtml,/Activate pence forecast/);
   assert.match(percentHtml,/data-forecast-method="percent"/);
   assert.match(percentHtml,/data-forecast-method="unit"/);
   page.fuel='elec';
   assert.doesNotMatch(e('forecastControlMarkup(DEFAULT_JAN_RISE)'),/Gas \(p\/kWh\)/);
   assert.match(e('forecastControlMarkup(DEFAULT_JAN_RISE)'),/Electricity \(p\/kWh\)/);
   page.fuel='gas';
   assert.doesNotMatch(e('forecastControlMarkup(DEFAULT_JAN_RISE)'),/Electricity \(p\/kWh\)/);
   assert.match(e('forecastControlMarkup(DEFAULT_JAN_RISE)'),/Gas \(p\/kWh\)/);
   page.fuel='dual';
   e("activateForecastMethod('unit')");
   const unit=e('forecastSteps(DEFAULT_JAN_RISE)');
   for(const phase of ['jan','apr','jul','flat']){
     close(unit[phase].e,pct[phase].e,phase+' electricity same graph');
     close(unit[phase].g,pct[phase].g,phase+' gas same graph');
   }
   const markup=e('forecastControlMarkup(DEFAULT_JAN_RISE)');
   assert.match(markup,/Pence forecast active/);
   assert.match(markup,/aria-pressed="true">/);
   const before=e('forecastSteps(DEFAULT_JAN_RISE)');
   e("setForecastUnit('gas',12)");
   const afterGas=e('forecastSteps(DEFAULT_JAN_RISE)');
   for(const phase of ['jan','apr','jul','flat'])close(afterGas[phase].e,before[phase].e,phase+' gas must not alter electricity');
   e("setForecastUnit('elec',34)");
   const afterElectricity=e('forecastSteps(DEFAULT_JAN_RISE)');
   for(const phase of ['jan','apr','jul','flat'])close(afterElectricity[phase].g,afterGas[phase].g,phase+' electricity must not alter gas');
   page.fuel='elec'; e("activateForecastMethod('percent')");
   const gasBefore=e('forecastCurrentUnitRates().gas');
   e("setForecastUnit('gas',13)");
   assert.equal(e('forecastScenarioMode'),'percent');
   close(e('forecastCurrentUnitRates().gas'),gasBefore,'invalid gas click is ignored');
   // Updated approved forecasts must change the reference rates without hardcoded pence.
   page.fuel='dual';scope.DEFAULT_JAN_RISE=30;
   e("activateForecastMethod('unit')");
   const newer=e('forecastDefaultUnitRates()');
   assert.notEqual(newer.elec,defaultRates.elec);
   assert.notEqual(newer.gas,defaultRates.gas);
   for(const phase of ['jan','apr','jul','flat']){
     const other=e('forecastSteps(30)');
     e("activateForecastMethod('percent')");
     page.jan='30';
     const same=e('forecastSteps(30)');
     close(other[phase].e,same[phase].e,'updated forecast '+phase+' elec parity');
     close(other[phase].g,same[phase].g,'updated forecast '+phase+' gas parity');
     e("activateForecastMethod('unit')");
   }
 });
}
