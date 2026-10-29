"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const builder=fs.readFileSync("renewal-builder-v1.html","utf8");
const mobile=fs.readFileSync("renewal-mobile-experience-v2.66.13.js","utf8");
const functionChunk=(start,end)=>{
 const a=builder.indexOf(start),b=builder.indexOf(end,a+start.length);
 assert(a>=0&&b>a,"Missing live chart function: "+start);
 return builder.slice(a,b);
};
const geometry=functionChunk("function renewalQuarterGeometry(","function renewalFullChart(");
const fullChart=functionChunk("function renewalFullChart(","function renewalCostTableRow(");
const forecast=functionChunk("function phaseForecastLabel(","const GAS_W");
const months=Array.from({length:12},(_,i)=>{
 const d=new Date(Date.UTC(2026,10+i,1)),year=d.getUTCFullYear(),cal=d.getUTCMonth();
 const ph=year===2026?"conf":cal<3?"jan":cal<6?"apr":cal<9?"jul":"flat";
 return {k:d.toLocaleString("en-GB",{month:"short",timeZone:"UTC"}),year,cal,ph};
});
const svg={innerHTML:"",setAttribute(k,v){this[k]=v}};
const legend={innerHTML:""};
const scope={MONTHS:months,APR_FROM_JAN:1.085,JUL_FROM_APR:.904,
 document:{getElementById:id=>id==="renewalFourLineChart"?svg:id==="renewalLineLegend"?legend:null},
 builderCurrentMode:"fixed",renewalManualOldRates:()=>null,
 renewalSelectedRows:()=>({ending:{name:"Fixed Saver 66"},offered:{name:"Fixed Saver 100"},public:{name:"Fixed Saver 101"}}),
 renewalRawName:row=>row?.name||"",niceStep:()=>50,
 gbp:n=>"£"+Math.round(n),safeHtml:x=>String(x).replaceAll("<","&lt;"),
 Math,Number,Date
};
vm.runInNewContext(geometry+forecast+fullChart+
 "renewalFullChart({janRise:27,variableName:'Double Gold',offerName:'Fixed Saver 100'},null,Array(12).fill(200),Array(12).fill(183),Array(12).fill(185));",scope);
const expected=["Confirmed","+27%","+8.5%","−9.6%","0%"];
const labels=[...svg.innerHTML.matchAll(/class="renewal-quarter-forecast" data-quarter="([^"]+)" x="([^"]+)" y="16"[^>]*>([^<]+)<\/text>/g)];
assert.equal(labels.length,5,"Each of the five comparison quarters needs a forecast label");
assert.deepEqual(labels.map(m=>m[3]),expected);
const edges=svg.innerHTML.match(/data-quarter-edges="([^"]+)"/)?.[1].split(",").map(Number);
assert.equal(edges?.length,6,"Five quarters require six shared geometry boundaries");
const dividers=[...svg.innerHTML.matchAll(/class="renewal-quarter-divider" x1="([^"]+)"[^>]*stroke-dasharray="2 4"/g)];
assert.equal(dividers.length,4,"One subtle divider between each adjacent quarter");
for(let i=0;i<4;i++)assert(Math.abs(Number(dividers[i][1])-edges[i+1])<0.02,
 "SVG quarter line must match the quarterly table boundary");
for(let i=0;i<5;i++)assert(Math.abs(Number(labels[i][2])-(edges[i]+edges[i+1])/2)<0.02,
 "Forecast label must be centred over its own quarter");
assert(!svg.innerHTML.includes("cap scenario"),"January-only label must be replaced");
assert.match(mobile,/data\.quarterLayout/,"The table must consume the exact same quarter geometry");
assert.match(mobile,/safe\(q\.forecast\)/,"Forecast headings in the table remain dynamic");
assert.match(mobile,/#renewalQuarterlyCosts \.renewal-q-cell:not\(\.header\)\{color:#251e2c!important\}/);
assert.match(mobile,/#renewalQuarterlyCosts \.renewal-q-cell \.q-delta\.less\{color:#00865a!important\}/);
assert.match(mobile,/#renewalQuarterlyCosts \.renewal-q-cell \.q-delta\.more\{color:#cb2344!important\}/);
assert.match(mobile,/#renewalQuarterlyCosts \.renewal-q-cell\.best\{box-shadow:inset 0 -2px 0 #aaa0b8!important\}/);
assert.match(mobile,/renewal-mobile-experience-v2\.66\.13|renewalMobileStylesV26613/);
assert.match(builder,/renewal-mobile-experience-v2\.66\.13\.js/);
console.log("PASS: each quarter forecast + matching grid divider; neutral quarter costs with green savings and red extras");
