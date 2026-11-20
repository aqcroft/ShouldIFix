# Should I Fix? - changes

## v2.68 (preview only) - 20 November 2026
- Public-facing Spring Clean preview, not merged into production.
- Three compact forecast buttons are now **CI**, **MSE%** and **MSEp**, retaining MoneySavingExpert percentage as the default. Original calculations and forecast options are unchanged.
- The selected fixed/Tracker service tier now appears before the headline comparison.
- Results use a short "Potential savings to [date]" heading, with the estimated start-date detail behind an information control and one shared "vs Std Var Price Cap" benchmark label.
- All three floating £/m values remain monthly averages; moved "Monthly average" to a horizontal, readable chart legend and removed the repeating explanatory paragraph below the graph.
- Shortened the prospective chart legend to "Std Var Price Cap"; existing-customer scenarios still show the customer-entered variable tariff name.
- Collapsed the quarterly breakdown, kept the full cost comparison and EV controls collapsed, and combined the outlook, FAQs, model assumptions and source links in one expandable information section.
- Simplified sharing to "Copy comparison link" and shorter quote and bill review links. Kept a short, visible UW Partner / estimate disclosure.
- Retained calculator element IDs and the entire underlying compute() function, verified unchanged against production; checked embedded JavaScript syntax and static HTML tag nesting.
- Review link: https://aqcroft.github.io/ShouldIFix/spring-clean-preview-v268.html
- No production changes until the preview is approved.


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
