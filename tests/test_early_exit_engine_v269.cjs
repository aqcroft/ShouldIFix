"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const engine=require("../early-exit-engine-v2.69.js");
const html=fs.readFileSync(path.join(__dirname,"..","renewal-builder-v1.html"),"utf8");
const oldRate={eU:15,eSC:25,gU:5,gSC:25};
const newRate={eU:18,eSC:30,gU:6,gSC:30};
const varRate={eU:27,eSC:55,gU:8,gSC:30};
const futureRate={eU:20,eSC:32,gU:7,gSC:30};
const eW=Array(12).fill(1/12);
const gW=[.164,.128,.127,.086,.044,.027,.026,.024,.032,.069,.122,.151];
function input(overrides={}){return {startDate:"2026-11-20",endDate:"2027-10-31",expiryDate:"2027-02-28",
  newExpiryDate:"2027-10-31",futureExpiryDate:"2028-10-31",processDate:"2026-11-20",waitProcessDate:"2027-01-10",
  mode:"dual",electricHeat:false,elecKwh:2500,gasKwh:9500,elecWeights:eW,gasWeights:gW,
  dualFuelDiscountPDay:0,oldRate,newRate,variableRate:varRate,futureRate,feeStatus:"assumed-fee",elecFee:75,gasFee:75,...overrides};}

test("month following processing and 49-day threshold use calendar dates",()=>{
  assert.equal(engine.iso(engine.firstNextMonth("2026-11-30")),"2026-12-01");
  assert.equal(engine.iso(engine.firstNextMonth("2026-12-01")),"2027-01-01");
  assert.equal(engine.boundsForExpiry("2027-02-28"),"2027-01-10");
});

test("November request applies new rates from 1 December and keeps old fix through February",()=>{
  const r=engine.compare(input());
  assert.equal(r.dates.changeEffective,"2026-12-01");
  assert.deepEqual(r.paths.now.months.filter(m=>m.month===11||m.month===0||m.month===1).map(m=>[m.year,m.month]),[[2026,11],[2027,0],[2027,1]]);
  assert.equal(r.paths.keep.months.find(m=>m.year===2027&&m.month===0).total,
    r.paths.keep.months.find(m=>m.year===2027&&m.month===0).electricity+r.paths.keep.months.find(m=>m.year===2027&&m.month===0).gas);
  assert.equal(r.paths.keep.months.find(m=>m.year===2027&&m.month===0).fees||0,0);
  assert.equal(r.paths.now.fees.e,75);assert.equal(r.paths.now.fees.g,75);
  assert.equal(r.paths.now.months.find(m=>m.year===2026&&m.month===10).fees||0,0);
  assert.equal(r.paths.now.months.find(m=>m.year===2026&&m.month===11).fees,150);
  assert.equal(r.paths.wait.months.find(m=>m.year===2027&&m.month===1).fees,150);
});

test("processing on 1 December moves the internal change to 1 January",()=>{
  const r=engine.compare(input({processDate:"2026-12-01"}));
  assert.equal(r.dates.changeEffective,"2027-01-01");
  assert.equal(r.paths.now.months.find(m=>m.year===2026&&m.month===11).total,
    r.paths.keep.months.find(m=>m.year===2026&&m.month===11).total);
  assert.equal(r.paths.now.months.find(m=>m.year===2027&&m.month===0).fees,150);
});

test("switch fees after the comparison horizon are not charged inside it",()=>{
  const r=engine.compare(input({endDate:"2026-11-30",processDate:"2026-11-30",waitProcessDate:"2026-11-30"}));
  assert.deepEqual(r.paths.now.fees,{e:0,g:0});
  assert.deepEqual(r.paths.wait.fees,{e:0,g:0});
});

test("gas-only, electricity-only and dual-fuel exit fees are fuel-specific",()=>{
  const dual=engine.compare(input());
  const gas=engine.compare(input({mode:"gas"}));
  const elec=engine.compare(input({mode:"elec"}));
  assert.deepEqual(dual.paths.now.fees,{e:75,g:75});
  assert.deepEqual(gas.paths.now.fees,{e:0,g:75});
  assert.deepEqual(elec.paths.now.fees,{e:75,g:0});
  assert.deepEqual(dual.paths.wait.fees,{e:75,g:75});
});

test("49-day date does not waive fees unless the contract-specific status confirms it",()=>{
  const assumed=engine.compare(input({processDate:"2027-01-10",waitProcessDate:"2027-01-10"}));
  const free=engine.compare(input({processDate:"2027-01-10",feeStatus:"confirmed-free"}));
  assert.deepEqual(assumed.paths.now.fees,{e:75,g:75});
  assert.deepEqual(free.paths.now.fees,{e:0,g:0});
  const unconfirmed=engine.compare(input({feeStatus:"unconfirmed"}));
  assert.equal(unconfirmed.feeConfirmed,false);
  assert.equal(unconfirmed.feeStatus,"unconfirmed");
});

test("mid-month expiry prorates old fixed and variable periods without a missing day",()=>{
  const r=engine.compare(input({expiryDate:"2027-02-14",processDate:"2027-02-01",endDate:"2027-10-31"}));
  assert.equal(r.paths.keep.months.find(m=>m.year===2027&&m.month===1).days,28);
  assert(Number.isFinite(r.paths.keep.total));
});

test("electricity VAT changes after March 2027 and gas retains 5% VAT",()=>{
  const r=engine.compare(input({startDate:"2027-03-01",endDate:"2027-04-30",expiryDate:"2027-12-31",
    newExpiryDate:"2027-12-31",futureExpiryDate:"2028-12-31",processDate:"2027-03-01",waitProcessDate:"2027-03-01"}));
  const march=r.paths.keep.months.find(m=>m.month===2),april=r.paths.keep.months.find(m=>m.month===3);
  assert(march.electricity<april.electricity);
  assert(march.gas>0&&april.gas>0);
});

test("usage uses winter gas weights, including electric-heating weighting",()=>{
  const dual=engine.compare(input()).paths.keep.months;
  assert(dual.find(m=>m.month===0).gas>dual.find(m=>m.month===6).gas);
  const electric=engine.compare(input({mode:"elec",electricHeat:true})).paths.keep.months;
  assert(electric.find(m=>m.month===0).electricity>electric.find(m=>m.month===6).electricity);
});

test("missing future rates fail closed and fall/rise scenarios affect wait path",()=>{
  assert.throws(()=>engine.compare(input({futureRate:null})),/rates/i);
  const lower=engine.compare(input({futureRate:{eU:10,eSC:12,gU:3,gSC:12}}));
  const higher=engine.compare(input({futureRate:{eU:35,eSC:45,gU:12,gSC:45}}));
  assert.notEqual(lower.paths.wait.total,higher.paths.wait.total);
  assert.notEqual(lower.differenceNowVsWait,higher.differenceNowVsWait);
});

test("single-fuel scenarios require only that fuel's rates",()=>{
  const gasOnly={eU:null,eSC:null,gU:7,gSC:30};
  const gas=engine.compare(input({mode:"gas",oldRate:gasOnly,newRate:gasOnly,variableRate:gasOnly,futureRate:gasOnly}));
  assert(Number.isFinite(gas.paths.wait.total));
  const electricOnly={eU:20,eSC:30,gU:null,gSC:null};
  const electric=engine.compare(input({mode:"elec",oldRate:electricOnly,newRate:electricOnly,variableRate:electricOnly,futureRate:electricOnly}));
  assert(Number.isFinite(electric.paths.wait.total));
});

test("renewal UI exposes no invented future prices and source links, with share round-trip inputs",()=>{
  assert.match(html,/Enter the relevant future fuel rates in p\/kWh and p\/day/);
  assert.match(html,/moneysavingexpert\.com\/utilities\/how-to-switch-energy-suppliers/);
  assert.match(html,/citizensadvice\.org\.uk\/consumer\/energy\/energy-supply\/get-a-better-energy-deal\/switching-energy-supplier/);
  assert.match(html,/p\.set\("ex","1"\)/);
  assert.match(html,/\["exeu","earlyFutureEU"\]/);
  assert.match(html,/P\.get\("ex"\)==="1"/);
});
