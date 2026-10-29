"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const mobile=fs.readFileSync("renewal-mobile-experience-v2.66.13.js","utf8");
const builder=fs.readFileSync("renewal-builder-v1.html","utf8");
const standalone=fs.readFileSync("Oct2026.html","utf8");
assert.match(mobile,/#renewalFourLineChart #renewalLineLegend/,"Legend must occupy graph's existing left gutter");
assert.match(mobile,/chartPanel\.appendChild\(legendPanel\)/,"Legend must overlay SVG instead of shrinking plot");
assert.doesNotMatch(mobile,/renewalComparisonLayout/,"Separate chart sidebar would break alignment");
assert.match(mobile,/data\.years\[b\]-data\.years\[a\]/,"Highest-to-lowest tariff order");
assert.match(mobile,/writing-mode:vertical-rl/,"Both names and monthly costs are vertical");
assert.match(mobile,/\.renewal-key-item b,#renewalFourLineChart/,"Name uses vertical text");
assert.match(mobile,/renewal-saving-card\{background:color-mix/,"Tint the three existing hero cards");
assert.match(mobile,/insertAdjacentElement\('afterend',key\)/,"Keep legend element across renders");
assert.match(mobile,/quarterly\.style\.setProperty\('--renewal-quarter-columns'/,"Preserve month/quarter geometry");
assert.match(builder,/renewal-mobile-experience-v2\.66\.13\.js/);
assert.doesNotMatch(builder,/line\(Array\(months\.length\)\.fill\(budget\)/,"Do not draw Budget Plan flat line");
assert.match(builder,/line\(old,colors\.old/,"Historical tariff line stays");
assert.match(builder,/line\(fix100,colors\.public,'stroke-dasharray/,"Make two close fixed lines distinguishable");
assert.match(standalone,/url\.searchParams\.set\('existing','1'\)/,"Retain modern existing customer route");
assert.match(standalone,/routeParams\.get\('renew'\)!=='1'/,"Preserve historical shared links");
for(const [name,html] of [["standalone",standalone],["builder",builder]]){
  const start=html.indexOf("function draw(res,janRise,s,tracker){");
  const end=html.indexOf("/* ---- state + render ---- */",start);
  assert(start>=0&&end>start,name+": draw function must be present");
  const code=html.slice(start,end);
  assert.match(code,/m\.fullDays\/m\.days/,name+": normalize edge chart months");
  assert.match(code,/res\.rows\.map/,name+": plot derives a separate array");
  assert.match(code,/full-calendar-month equivalents/,name+": visible explanatory note");
  const chart={innerHTML:""};
  const months=[
    {k:"Oct",cal:9,quarter:"2026-Q4",days:1,fullDays:31},
    {k:"Nov",cal:10,quarter:"2026-Q4",days:30,fullDays:30},
    {k:"Dec",cal:11,quarter:"2026-Q4",days:31,fullDays:31}
  ];
  const row=(k,ph,cap,fixed,tracker)=>({k,ph,cap,fixed,tracker});
  const rows=[row("Oct","conf",5,5,5),row("Nov","conf",155,160,170),row("Dec","conf",160,165,175)];
  const res={rows,yCap:320,yFix:330,ySave:-10};
  const ctx={
    MONTHS:months,res,document:{getElementById:()=>chart},DEFAULT_JAN_RISE:27,
    liveFixedRow:()=>null,safeHtml:x=>x,niceStep:()=>50,
    forecastScenarioValues:()=>[0,15,27,30],gbp:n=>'£'+Math.round(n),Number,Math
  };
  vm.runInNewContext(code+"\ndraw(res,27,{region:{n:11},tariff:'custom',renewal:false},null);",ctx);
  assert.equal(res.rows[0].cap,5,name+": pro-rated model row must remain unchanged");
  assert.equal(res.yCap,320,name+": year total must remain unchanged");
  const match=chart.innerHTML.match(/<path d="([^"]+)" fill="none" stroke="var\(--fixed\)"/);
  assert(match,name+": fixed chart path must be drawn");
  const coordinates=[...match[1].matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(coordinates.length,3);
  assert(Math.abs(coordinates[0][1]-coordinates[1][1])<80,name+": first one-day month must look like a whole month");
  assert(chart.innerHTML.includes("quarterly costs and savings use the actual pro-rated comparison dates"));
}
console.log("PASS: compact vertical overlay and hero tint; omitted budget plot; full-month graph, untouched pro-rated data, standalone and renewal builder");
