"use strict";
const fs=require("node:fs");
const assert=require("node:assert/strict");
const builder=fs.readFileSync("renewal-builder-v1.html","utf8");
const mobile=fs.readFileSync("renewal-mobile-experience-v2.66.12.js","utf8");
const standalone=fs.readFileSync("Oct2026.html","utf8");

// The input is removed from the form but the DOM ID is maintained solely for
// backward compatibility with old shared bp= links.
assert.doesNotMatch(builder,/Current monthly payment<\/h3>/);
assert.doesNotMatch(builder,/Choose the two tariffs, then add the monthly payment/);
assert.doesNotMatch(builder,/function renewalBudgetReference\(s\)/);
assert.match(builder,/<input id="renewalBudgetMonthly" type="hidden" value=""/);
assert.match(builder,/if\(P\.has\("bp"\)\)document\.getElementById\("renewalBudgetMonthly"\)/);
assert.match(builder,/if\(budget!==null\)p\.set\("bp",budget\.toFixed\(2\)\)/);
assert.match(builder,/<span class="renewal-simple-number">3<\/span> Estimated annual usage/);

// Remove decorative copy, but do not weaken the permission-based share gate.
assert.doesNotMatch(builder,/Only share a customer link after verifying the tariff options and usage/);
assert.doesNotMatch(builder,/>What are my options\?</);
assert.doesNotMatch(builder,/Compare your monthly Budget Plan, previous fixed tariff/);
assert.match(builder,/<p class="renewal-profile" id="renewalCustomerProfile" hidden><\/p>/);
assert.match(builder,/<p class="renewal-chart-subtitle" id="renewalChartIntro" hidden><\/p>/);
assert.match(builder,/canShare\?\s*"":renewalOfferManualActive\?/);
assert.match(builder,/Manual offer rates: on-screen comparison only\. Sharing disabled\./);
assert.match(builder,/Choose verified rates before sharing\./);
assert.match(builder,/document\.getElementById\("builderCopyLink"\)\.disabled=!canShare/);
assert.doesNotMatch(builder,/The red dotted line represents the stated monthly payment/);
assert.doesNotMatch(builder,/Red dotted: your current Budget Plan payment/);
assert.doesNotMatch(builder,/navy dotted shows the monthly Budget Plan payment/);

// Colour mapping is shared by the actual SVG and the mobile cards/legend.
assert.match(builder,/\["#00865a","#e57b00","#e21b3c"\]/);
assert.match(mobile,/const palette=\{green:'#00865a',amber:'#e57b00',red:'#e21b3c'\}/);
assert.match(mobile,/renewal-saving-card\{background:color-mix\(in srgb,var\(--rank-color\) 13%,white\)/);
assert.match(mobile,/grid-template-rows:repeat\(3,minmax\(0,1fr\)\)!important/);
assert.match(mobile,/data\.years\[b\]-data\.years\[a\]/);
assert.match(builder,/line\(old,colors\.old/);
assert.doesNotMatch(builder,/line\(Array\(months\.length\)\.fill\(budget\)/);
assert.match(builder,/renewal-mobile-experience-v2\.66\.12\.js/);
assert.match(standalone,/App version: 2\.66\.12/);
assert.match(builder,/forecast-feed\.js\?v=2\.66\.12/);
console.log("PASS: redundant Budget Plan prompt removed, minimal result copy, valid sharing protections, vivid matching colours and existing historical data");
