"""No-network regression tests for the MSE source-table parser."""
import copy
import datetime as dt
import importlib.util
import json
import pathlib
import unittest

BASE = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("mse_scraper", BASE / "scripts" / "check_mse_forecast.py")
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

HTML = """<!doctype html><html><body><article>
<p>Updated 15 October 2026</p>
<h2>Annual Price Cap predictions for week starting 12 Oct</h2>
<table><thead><tr><th>Supplier</th><th>1 Oct to 31 Dec 2026</th>
<th>1 Jan to 31 March 2027</th><th>1 Apr to 30 June 2027</th>
<th>1 Jul to 30 Sep 2027</th></tr></thead><tbody>
<tr><td>EDF (1)</td><td>UP 3.6% £1,723 a year</td><td>UP 24.7% £2,148 a year</td>
<td>UP 2.6% £2,204 a year</td><td>DOWN 10.1% £1,981 a year</td></tr>
<tr><td>British Gas (2)</td><td>UP 3.6% £1,723 a year</td><td>UP 26.8% £2,185 a year</td>
<td>UP 0.2% £2,190 a year</td><td>No prediction yet</td></tr>
<tr><td>E.on Next (3)</td><td>UP 3.6% £2,088 a year</td><td>UP 23.6% £2,130 a year</td>
<td>UP 3.8% £2,211 a year</td><td>DOWN 9.5% £2,000 a year</td></tr>
<tr><td>Average (4)</td><td>UP 3.6% £1,723 a year</td><td>UP 25% £2,154 a year</td>
<td>UP 2.2% £2,202 a year</td><td>DOWN 9.8% £1,985 a year</td></tr></tbody></table>
<p>Based on a dual-fuel household paying by Direct Debit.
(1) According to the latest prediction (on 13 October 2026).
(2) According to the latest prediction (on 15 October 2026).
(3) According to the latest prediction (on 12 October 2026).</p>
</article></body></html>"""


class MSEParserTests(unittest.TestCase):
    def setUp(self):
        self.approved = json.loads((BASE / "forecast-data.json").read_text(encoding="utf-8"))
        self.day = dt.date(2026, 10, 17)

    def test_published_week_and_supplier_table(self):
        found = mod.read_table(HTML, self.approved, today=self.day)
        self.assertEqual(found["revision"], "mse-2026-10-12")
        self.assertEqual([p["average"]["change_pct"] for p in found["periods"]], [3.6, 25.0, 2.2, -9.8])
        self.assertIsNone(found["suppliers"][1]["values"][3])
        self.assertEqual(found["suppliers"][0]["predicted_on"], "2026-10-13")
        same = copy.deepcopy(found)
        same["periods"][1]["average"]["change_pct"] = 25
        self.assertEqual(mod.signature(found), mod.signature(same))

    def test_detects_numerical_change_even_same_source_week(self):
        baseline = mod.read_table(HTML, self.approved, today=self.day)
        changed = HTML.replace("UP 25% £2,154", "UP 27% £2,188")
        found = mod.read_table(changed, self.approved, today=self.day)
        self.assertNotEqual(mod.signature(found), mod.signature(baseline))

    def test_rejects_incomplete_table(self):
        with self.assertRaises(ValueError):
            mod.read_table(HTML.replace("DOWN 9.8% £1,985 a year", "No prediction yet"), self.approved, today=self.day)

    def test_rejects_changed_quarters(self):
        with self.assertRaises(ValueError):
            mod.read_table(HTML.replace("1 Apr to 30 June 2027", "1 Apr to 30 June 2028"), self.approved, today=self.day)

    def test_rejects_implausibly_old_page(self):
        with self.assertRaises(ValueError):
            mod.read_table(HTML, self.approved, today=dt.date(2027, 3, 1))


if __name__ == "__main__":
    unittest.main()
