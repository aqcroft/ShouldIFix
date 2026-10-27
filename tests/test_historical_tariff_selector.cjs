"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const html=fs.readFileSync("renewal-builder-v1.html","utf8");
function section(a,b){
  const i=html.indexOf(a),j=html.indexOf(b,i);
  assert(i>=0&&j>i,"Missing function section: "+a);
  return html.slice(i,j);
}
const source=section("function renewalRawName(row){","function renewalSourceDate(row){")+
  section("function renewalRows(){","function renewalSetOptions(id){");
const ctx={
  renewalCatalogue:null,
  document:{getElementById(id){return {value:"3"};}},
  standardFixedRate(r){return r.EDSC_Std>0&&r.EUR_Std>0;},
  renewalSourceDate(r){return Date.parse(r.pdf_source_date||"2026-01-01");}
};
vm.createContext(ctx);
vm.runInContext(source,ctx);
function record(name,ver,rate,url){
 return {tariff_name:name,tariff_type:"fixed",payment_method:"DD",region_no:11,
  EDSC_Std:42,EUR_Std:rate,GDSC:19,GUR:7.1,source_ref:"UEWETL221025",
  fixed_end_date:"2026-10-31",rate_version_code:ver,
  tariff_version_id:name.toUpperCase().replace(/ /g,"_")+"__"+ver,
  tariff_display_name:name+" ("+ver+")",source_pdf_url:url};
}
const pre=record("Fixed Saver 65","PRE_APR_2026",23.289,"one.pdf");
const post=record("Fixed Saver 65","POST_APR_2026",19.944,"two.pdf");
const dup1=record("Fixed Saver 81","IDENTICAL_COPY_1",25.789,"three.pdf");
const dup2=record("Fixed Saver 81","IDENTICAL_COPY_2",25.789,"four.pdf");
ctx.renewalCatalogue={tariffLive:[],tariffHistory:[pre,post,dup1,dup2]};
assert.notEqual(vm.runInContext("renewalRowKey(renewalCatalogue.tariffHistory[0])",ctx),
  vm.runInContext("renewalRowKey(renewalCatalogue.tariffHistory[1])",ctx));
const choices=vm.runInContext('renewalOptionsFor("renewalEnding")',ctx);
assert.equal(choices.filter(r=>r.tariff_name==="Fixed Saver 65").length,2);
assert.equal(choices.filter(r=>r.tariff_name==="Fixed Saver 81").length,1);
assert.equal(choices.find(r=>r.tariff_name==="Fixed Saver 65").rate_version_code,"POST_APR_2026");
assert(choices.every(r=>r.tariff_display_name));

assert(html.indexOf('id="builderHistoryDetails"') < html.indexOf('id="builderCurrentSwitch"'));
assert(html.indexOf('id="builderHistoryDetails"') < html.indexOf('id="builderElecRange"'));
assert(html.includes('id="builderArchivedRateSummary"'));
assert(html.includes('<details id="renewalManualDetails" class="renewal-mini-details">'));
assert(!html.includes('<details id="renewalManualDetails" open>'));
assert(html.includes('const available=historical.filter(row=>renewalHistoryRateFrom(row)<=historicalMonth.getTime())'));
const dateSrc=section("function renewalHistoryRateFrom(row){","function renewalLastYearMonthly(s){");
const dateCtx={renewalSourceDate(r){return Date.parse(r.pdf_source_date);},renewalVersionPreference(){}};
vm.createContext(dateCtx);
vm.runInContext(dateSrc,dateCtx);
assert.equal(vm.runInContext('renewalHistoryRateFrom({rate_version_code:"POST_APR_2026",pdf_source_date:"2025-10-22"})',dateCtx),Date.UTC(2026,3,1));
assert.equal(vm.runInContext('renewalHistoryRateFrom({rate_version_code:"PRE_APR_2026",pdf_source_date:"2025-10-22"})',dateCtx),Date.UTC(2025,9,22));

const builder=section('<section class="renewal-builder hidden" id="renewalBuilder"', '<section id="renewalStory"');
const find=id=>builder.indexOf('id="'+id+'"');
assert(find("builderHistoryDetails")<find("renewalSuitePicks"),"Old tariff before offered tariff");
assert(find("renewalSuitePicks")<find("renewalBudgetMonthly"),"Offer before monthly payment");
assert(find("renewalBudgetMonthly")<find("builderElecExact"),"Payment before annual usage");
assert(find("builderElecExact")<find("builderOptionalSettings"),"Annual usage before optional settings");
assert(find("builderCurrentSwitch")>find("builderOptionalSettings"),"Variable/fixed is optional");
assert(find("builderServiceSwitch")>find("builderOptionalSettings"),"Services are in optional settings");
assert(find("builderCustomer")>find("builderOptionalSettings"),"Customer name is optional");
assert(builder.includes('<details class="renewal-mini-details" id="builderUsageAdjust">'));
assert(builder.includes('id="renewalOfferedQuickSelect"'));
assert(builder.includes('<details id="renewalManualDetails" class="renewal-mini-details">'));
assert(html.includes('document.getElementById("renewalPreviousBudget").hidden=true;'));
assert(!html.includes("For reference, you are currently paying about"));
assert(html.includes('let builderCurrentMode="fixed";'));
const ids=[...builder.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,"Every builder ID must be unique");
console.log("Historical simplified four-step builder, historical selector and April effective-date tests passed.");
