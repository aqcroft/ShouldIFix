"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const ShouldIFixLabelPlacement=require("../chart-label-placement-v2.69.js");
const mobile=fs.readFileSync("renewal-mobile-experience-v2.66.13.js","utf8");
const standalone=fs.readFileSync("Oct2026.html","utf8");
const builder=fs.readFileSync("renewal-builder-v1.html","utf8");

// Renewal: three vertically stacked labels, highest cost first, all matching line colours.
assert.match(mobile,/grid-template-columns:minmax\(0,1fr\)!important/);
assert.match(mobile,/grid-template-rows:repeat\(3,minmax\(0,1fr\)\)!important/);
assert.match(mobile,/data\.years\[b\]-data\.years\[a\]/);
assert.match(mobile,/variable:'Variable'/);
assert.match(mobile,/\.renewal-key-item b\{color:var\(--rank-color\)!important\}/);
assert.match(mobile,/\.renewal-key-monthly/);
assert.match(mobile,/replace\(\/Fixed Saver\\s\+\/i,'Fixed '\)/);
assert.match(builder,/renewal-mobile-experience-v2\.66\.13\.js/);
assert.match(builder,/renewalQuarterGeometry\(MONTHS\)/);
assert.match(standalone,/meta name="app-version" content="2\.69\.0"/);

for (const [name,html] of [["standalone",standalone],["builder",builder]]) {
  assert.match(html,/\.chart-key-item\.fix\{color:var\(--fixed\)\}/);
  assert.match(html,/\.chart-key-item\.tracker\{color:var\(--tracker\)\}/);
  assert.match(html,/\.chart-key-item\.cap\{color:var\(--cap\)\}/);
  assert.match(html,/\.chart-key\{left:2px;top:6%;height:86%;width:34px;/);
  assert.match(html,/\.chart-key-item span,\.chart-key-item strong\{writing-mode:vertical-rl/);
  assert.match(html,/\.chart-key\{left:1px;width:31px;gap:4px\}/);
  const start=html.indexOf("function draw(res,janRise,s,tracker){");
  const end=html.indexOf("/* ---- state + render ---- */",start);
  assert(start>=0&&end>start);
  const chart={innerHTML:""};
  const rows=[
    {k:"Oct",ph:"conf",cap:5,fixed:5,tracker:5},
    {k:"Nov",ph:"conf",cap:155,fixed:160,tracker:170},
    {k:"Dec",ph:"conf",cap:160,fixed:170,tracker:175}
  ];
  const res={rows,yCap:320,yFix:335,ySave:-15};
  const context={res,document:{getElementById:()=>chart},
    MONTHS:[
      {k:"Oct",quarter:"2026-Q4",days:1,fullDays:31},
      {k:"Nov",quarter:"2026-Q4",days:30,fullDays:30},
      {k:"Dec",quarter:"2026-Q4",days:31,fullDays:31}
    ],
    liveFixedRow:()=>null,safeHtml:x=>x,niceStep:()=>50,
    DEFAULT_JAN_RISE:27,forecastScenarioValues:()=>[0,15,27,30],
    forecastScenarioMode:'percent',forecastControlMarkup:()=>'<div>scenario buttons</div>',
    gbp:n=>"£"+Math.round(n),Math,Number,ShouldIFixLabelPlacement
  };
  vm.runInNewContext(html.slice(start,end)+"\ndraw(res,27,{region:{n:11},tariff:'custom',renewal:false}, {series:'101'});",context);
  assert.match(chart.innerHTML,/class="chart-key-item fix"/,name+" fixed key missing");
  assert.match(chart.innerHTML,/class="chart-key-item tracker"/,name+" tracker key missing");
  assert.match(chart.innerHTML,/class="chart-key-item cap"/,name+" variable key missing");
  if(name==='standalone'){
    assert.match(chart.innerHTML,/<text[^>]*>£162\/m<\/text>/,name+" fixed plotted full-month average");
    assert.match(chart.innerHTML,/<text[^>]*>£167\/m<\/text>/,name+" Tracker plotted full-month average");
    assert.match(chart.innerHTML,/<text[^>]*>£157\/m<\/text>/,name+" variable plotted full-month average");
  }else{
    assert.match(builder,/ShouldIFixLabelPlacement\.place\(plottedSeries,plottedSeries/);
    assert.match(builder,/class="renewal-cost-tag"/);
  }
  assert.equal(res.rows[0].cap,5,name+" must preserve October's pro-rated cost");
  assert.equal(res.yCap,320,name+" must preserve financial totals");
  if(name==='standalone')assert.match(standalone,/Quarterly totals are pro-rated to those dates/);
}
console.log("PASS: three stacked ranked labels, matched colours, prospective monthly equivalents, unchanged financial totals");
