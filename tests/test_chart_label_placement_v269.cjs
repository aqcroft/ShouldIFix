"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const placement=require("../chart-label-placement-v2.69.js");
const html=fs.readFileSync(path.join(__dirname,"..","Oct2026.html"),"utf8");
const W=548,H=360,top=48,bottom=322;
function check(series){
  const tags=series.map(s=>({key:s.key,points:s.points}));
  const placed=placement.place(tags,series,{width:W,height:H,plotTop:top,plotBottom:bottom});
  assert.equal(placed.length,series.length);
  for(const p of placed){
    assert(p.x-p.w/2>=0&&p.x+p.w/2<=W,"tag stays inside chart edges");
    assert(p.y-p.h/2>=0&&p.y+p.h/2<=H,"tag stays inside chart edges");
    assert.equal(placement.collidesWithSeries(p,series,5),false,"tag box does not cover a line or data marker");
  }
  for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
    const a=placed[i],b=placed[j];
    assert(a.x+a.w/2+6<=b.x-b.w/2||b.x+b.w/2+6<=a.x-a.w/2||
      a.y+a.h/2+6<=b.y-b.h/2||b.y+b.h/2+6<=a.y-a.h/2,"tags retain clearance");
  }
  return placed;
}

test("tags avoid plotted paths and points for three seasonal series",()=>{
  const s=[
    {key:"cap",points:[[24,240],[70,210],[116,180],[162,145],[208,110],[254,130],[300,170],[346,200],[392,220],[438,190],[484,150],[530,120]]},
    {key:"fix",points:[[24,260],[70,250],[116,235],[162,220],[208,200],[254,180],[300,160],[346,150],[392,145],[438,150],[484,170],[530,190]]},
    {key:"tracker",points:[[24,230],[70,205],[116,190],[162,180],[208,170],[254,160],[300,155],[346,165],[392,175],[438,180],[484,180],[530,175]]}
  ];
  check(s);
});

test("identical and crossing lines fall back to a clear band above the plot",()=>{
  const same=[[60,100],[100,150],[140,200],[180,180],[220,140],[260,100]];
  const reverse=[...same].reverse();
  const p=check([{key:"a",points:same},{key:"b",points:same},{key:"c",points:reverse}]);
  assert.equal(p.length,3);
});

test("two-line existing customer charts keep both tags inside the viewBox",()=>{
  const p=check([{key:"old",points:[[50,280],[140,230],[230,180],[320,150],[410,180],[500,230]]},
    {key:"new",points:[[50,250],[140,220],[230,200],[320,195],[410,200],[500,210]]}]);
  assert.equal(p.length,2);
});

test("narrow chart widths, low values, and gas-only shaped series remain collision-free",()=>{
  for(const width of [300,360,548]){
    const lines=[
      {key:"variable",points:[[12,305],[width*.22,280],[width*.42,230],[width*.62,130],[width*.82,80],[width-12,150]]},
      {key:"fixed",points:[[12,300],[width*.22,290],[width*.42,270],[width*.62,245],[width*.82,220],[width-12,205]]},
      {key:"tracker",points:[[12,299],[width*.22,289],[width*.42,270],[width*.62,240],[width*.82,210],[width-12,190]]}
    ];
    const placed=placement.place(lines.map(s=>({key:s.key,points:s.points})),lines,{width,height:H,plotTop:top,plotBottom:bottom});
    for(const p of placed){assert(p.x-p.w/2>=0&&p.x+p.w/2<=width);assert.equal(placement.collidesWithSeries(p,lines,5),false);}
  }
});

test("prospective chart shows left legend, monthly average once, and no duplicate SVG unit heading",()=>{
  assert.match(html,/chart-main-grid\{display:grid;grid-template-columns/);
  assert.match(html,/chart-inline-legend" aria-label="Chart legend"/);
  assert.equal((html.match(/Monthly average/g)||[]).length,1);
  assert.doesNotMatch(html,/Monthly energy cost \(£\)/);
  assert.match(html,/ShouldIFixLabelPlacement\.place\(labelTargets,plotted/);
});

test("quarter totals show actual comparison end date and mark best overall row",()=>{
  assert.match(html,/Quarterly costs - total to /);
  assert.match(html,/BEST OVERALL/);
  assert.match(html,/qCost\(null,"variable"/);
  assert.match(html,/#annualCosts\{display:none!important\}/);
});
