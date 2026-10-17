'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'Oct2026.html'), 'utf8');
const renderPrelude = html.match(/function render\(\)\{([\s\S]*?)\n  setComparisonPeriod\(s\);/);
assert.ok(renderPrelude, 'render must check verification before calculating');

function check(status, hasSelectedFixedTariff) {
  const strong = { textContent: '' };
  const notice = { hidden: null, querySelector: () => strong };
  const message = { textContent: '' };
  const retry = { hidden: null };
  const selected = hasSelectedFixedTariff ? { rate: 1 } : null;
  const classes = new Set(['tariff-unverified']);
  const body = {
    dataset: {},
    classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) }
  };
  const elements = { tariffCheck: notice, tariffCheckMessage: message, retryTariffs: retry };
  const context = {
    state: () => ({ region: { n: 11 }, tariff: 'saver' }),
    liveFixedRow: () => selected,
    standardFixedRate: row => row ? { eSC: 1, eU: 2, gSC: 3, gU: 4 } : null,
    evFeedStatus: status,
    document: { body, getElementById: id => elements[id] }
  };
  vm.runInNewContext('function verifyRender(){' + renderPrelude[1] + '\n}\nverifyRender();', context);
  return { notice, message, retry, strong, classes, body };
}

test('pending live UW feed hides every saving before the page paints', () => {
  assert.match(html, /<body class="tariff-unverified">/);
  assert.match(html, /body\.tariff-unverified #resultCard\{display:none!important\}/);
  const r = check('loading', false);
  assert.equal(r.body.dataset.tariffDataStatus, 'loading');
  assert.equal(r.classes.has('tariff-unverified'), true);
  assert.equal(r.notice.hidden, false);
  assert.equal(r.retry.hidden, true);
});

test('failed feed never silently exposes embedded fallback rate savings', () => {
  const r = check('error', false);
  assert.equal(r.body.dataset.tariffDataStatus, 'unavailable');
  assert.equal(r.classes.has('tariff-unverified'), true);
  assert.equal(r.notice.hidden, false);
  assert.equal(r.retry.hidden, false);
  assert.match(r.message.textContent, /no comparison is shown/i);
});

test('only a successful feed with a rate for the selected region unlocks results', () => {
  const r = check('live', true);
  assert.equal(r.body.dataset.tariffDataStatus, 'verified');
  assert.equal(r.classes.has('tariff-unverified'), false);
  assert.equal(r.notice.hidden, true);
});

test('partial live tariff feed for another region must not unlock the wrong quote', () => {
  const r = check('live', false);
  assert.equal(r.body.dataset.tariffDataStatus, 'unavailable');
  assert.equal(r.classes.has('tariff-unverified'), true);
  assert.equal(r.retry.hidden, false);
});

test('a standalone share URL cannot be copied before the feed is verified', () => {
  assert.match(html, /shareUrl"\)\.value=verified\?buildShareUrl\(s\):""/);
  assert.match(html, /if\(document\.body\.dataset\.tariffDataStatus!=="verified"\)\{copyBtn\.textContent="Verify tariffs first"/);
});

test('failed network request retries, then reports an error rather than using fallback', () => {
  assert.match(html, /if\(!applyLiveFixedTariffs\(d\)\)throw new Error/);
  assert.match(html, /if\(attempt<1\)/);
  assert.match(html, /evFeedStatus="error";render\(\)/);
});

test('main calculator script remains valid JavaScript', () => {
  const script = html.match(/<script>\\s*("use strict";[\\s\\S]*?)<\\/script>/);
  assert.ok(script, 'calculator script must be present');
  assert.doesNotThrow(() => new vm.Script(script[1]));
});
