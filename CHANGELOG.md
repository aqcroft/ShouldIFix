# Should I Fix? - changes

## v2.68.0 - 27 November 2026
- January now uses all 56 published regional Direct Debit cap components; confirmed through March.
- April/July use MSE week beginning 23 November annual forecasts of £2,222/£2,034 (displayed +2.5%/−8.5%). Unit forecasts retain the illustrative fuel split and regional differences, with standing charges flat before VAT.
- Electricity VAT stays zero through June; July forecast modelling accounts for the return to 5% once.
- Default percentage/pence modes match exactly. Alternative January scenarios remain available and labelled as scenarios.
- New shares carry cr=20261127; existing unversioned customer URLs retain the previous forecast assumptions. This does not add fixed-rate or date snapshots to legacy links.
- Future Tracker and entered renewal tariffs remain estimates, even when the underlying January cap is confirmed.
- Tests: 25 Node checks passed locally; browser checks added to PR workflow. Local browser unavailable (binary missing; download blocked).
- Sources: MSE regional cap table and fixing guide, retrieved 27 November 2026. Preview does not register a service worker or write customer profiles.


## v2.67 - 20 November 2026
- Added CI f/c to the left of the percentage and pence forecast controls. Percentage remains the default.
- CI f/c uses Cornwall Insight's 18 November 2026 UK national Jan-Mar 2027 unit and standing rates (electricity 32.54p/kWh, 56p/day; gas 10.90p/kWh, 31p/day). Proportionally adjusts the selected October regional Ofgem cap using October national benchmarks (26.32p, 54.83p, 7.97p, 29.68p). These are regional estimates, not confirmed local rates.
- Confirmed current Oct-Dec regional cap rates remain unchanged. Later April and July model scenarios retain the pre-existing illustrative percentage movements, not Cornwall Insight forecasts.
- CI scenario is encoded in shared links as ci=1, with existing percentage/pence links remaining compatible. Renewal comparisons proportionally stress entered variable rates, rather than substituting national cap rates.
- Floating monthly-average chart labels now read £X/m in blue, orange and purple pastel backgrounds, positioned near the seasonal peaks.
- Retains the compact forecast controls, full price-cap legend wording and five-position usage picker.
- Validated JS syntax, national and regional forecast ratios (all four components), October preservation, default percentage mode, share state and graphical monthly-average badges. Manual browser review should follow publication.
- Published source: https://www.cornwall-insight.com/predictions-and-insights-into-the-default-tariff-cap/


## v2.66.23 - 19 November 2026
- Confirmed prospective-customer variable costs use regional Ofgem price-cap rates and forecast uplifts, not Utility Warehouse Value Gold or Double Gold variable tariff rates.
- Renamed the prospective chart legend "Standard variable price cap"; existing-customer comparisons continue to display the actual entered variable tariff name.
- Replaced the four stretched usage buttons and expanding Custom form with three compact Low/Med/High buttons plus two permanent electricity/gas kWh fields.
- Preset figures remain visible but greyed out; Customise enables editing in place. Reset stays in the header and is disabled until needed, avoiding vertical movement.
- Preserved monthly average graph badges, forecast defaults, regional tariff maths and existing customer inputs.
- Embedded JavaScript syntax and synthetic comparison tests passed. Visual phone/desktop review remains outstanding.

## v2.66.22 - 19 November 2026
- Corrected the initial v2.66.21 preview where peak-month bills appeared in badges instead of monthly averages.
- Condensed the Current forecast area into a single heading with percentage and pence-per-kWh selectors.
- Percentage remains the default; only the selected method's six scenario choices are shown.
- Pence mode displays only the relevant electricity and/or gas rows, without redundant visible labels or explanations. Both fuel choices retain accessible names.
- Positioned monthly average £ labels on the chart near the seasonal peaks, using the same full-calendar-month-equivalent average previously shown in the legend; removed monthly amounts from the side legend.
- Ordered the legend from highest to lowest cost over the same pro-rated comparison period.
- Preserved regional tariff calculations, forecast rate precision, default assumptions and annual/quarterly savings maths.

Testing: the main embedded JavaScript compiles; forecast-control modes were checked in dual, electricity-only and gas-only configurations; the compute() calculation was verified unchanged. Visual/manual mobile and desktop browser review is still required before production merge.

Preview-only pages were retired after the v2.67 live release.
