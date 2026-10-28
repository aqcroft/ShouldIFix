# Historical renewal preview changelog

## v2.66.7 - 28 October 2026 - Match the compact prospective chart layout
- Scale renewal's chart and its five price-cap-quarter columns to the mobile viewport; remove the forced 690px horizontal scrolling and clipping.
- Keep three tariff cost rows directly beneath the plot, including individual quarter totals and comparisons, without altering monthly cost calculations.
- Display coloured monthly and annual costs in a compact responsive legend; remove SVG endpoint annotations that were cut off on mobile.
- Put lengthy forecast methodology behind a tappable disclosure, retaining Budget Plan and historical-cost explanations.
- Preserve live historical tariff rates, seasonality, partner/customer sharing controls, manual quote safeguards and customer mode persistence.

## v2.66.6 - 28 October 2026 - Unified user-facing version and compact renewal controls
- Align the user-facing Should I Fix version with Appointment Companion v2.66.6; repositories retain independent history and internal maintenance.
- Streamline expiring tariff selection to Fixed 66 / 65 / Choose and renewal offers to Fixed 100 / 99 / Choose in two compact rows, with cog controls for manual rates.
- Manual renewal offer rates are permitted for an explicitly entered on-screen scenario only. The customer share link is disabled for these unverified rates.
- Hide lengthy selected-tariff confirmations while preserving accessible status notices, archive choice, calculations, and verification safeguards.

## v2.79.5 - 27 October 2026
- Correct the renewal fuel-breakdown data references to the two verified annual model series; keep their underlying results unchanged.
- Tidy pence display and apply the illustrated variable-price caution to Value, Gold and Double Gold.
- Update browser regressions to check the original-style four-row quarter strip, 99/100 shortcuts, fuel detail modal and customer sharing.

## v2.79.4 - 27 October 2026
- Show only the Fixed 99 and 100 quick choices where genuinely present; older 98 remains accessible only via **Choose a different tariff**, without implying availability.
- Clarify historical fixed labels with `(April 26 rates)` and pre-April versions where applicable.
- Expand the three result modals with model-derived annual and equivalent monthly electricity/gas figures. Show source ex-VAT unit rates and standing charges for selected fixed tariffs; flag variable-fuel breakdown as illustrative, not a confirmed Double Gold tariff.
- Replace the horizontal comparison table with an original-style quarter strip directly aligned beneath the monthly line graph, three coloured tariff rows and quarterly savings.
- Restore the original gradient headline in embedded prospective mode, retaining the single Companion customer selector.
- No changes to the sums, VAT calculation, comparison dates or tariff-verification/sharing gates.

## v2.79.3 - 27 October 2026
- Place the high-contrast chart legend on the left immediately above the graph, including monthly and 12-month totals.
- Update tariff-verification regression expectations to reflect existing fail-closed sharing checks, without changing the guards.

## v2.79.2 - 27 October 2026
- Three compact, tappable renewal cost summaries (variable / email offer / public fixed) with accessible detail modal, including on shared customer links.
- Rank-based high-contrast green, amber and red chart lines, monthly annotations, left-aligned legend with monthly and 12-month figures, and model-derived quarterly cost comparison.
- Clarify fixed-tariff renewal headings and introduction; remove the obsolete preview warning for live and customer views, keeping an explicit demonstration-only warning.
- Hide the legacy embedded prospective mode switch and redundant hero only when launched with companion=1; standalone and public sharing retain their original options.
- No changes to energy calculation, historical tariff selection, quote sharing guards or tariff feed.

## v2.79.1 - 27 October 2026
- Hide the old prospective-customer Share panel in existing-customer renewal mode; use the dedicated verified renewal customer-link controls instead.
- Preserve the original prospective-customer comparison and sharing UI unchanged.

## v2.79.0 - 27 October 2026
- Add a direct partner entry URL using `?existing=1` so the four-input existing-customer renewal form opens without the standard calculator setup.
- Keep new-customer/default and customer-share links unchanged, and keep the real live tariff feed.
- Add a 390px browser test for the direct entry, real archive choices, individual offered tariff, kWh inputs and enabled customer-share link.
- The UW historical Apps Script endpoint is deployed and validated across all 14 regions; the ordinary feed continues to return 168 rows.

## v2.78.2 - 27th October 2026 (preview; not production)
- Require an explicit selection for both the customer's expiring fixed tariff and their individual renewal offer; do not guess based on the nearest expiry date or assume Fixed Saver 99 was offered.
- Do not enable a fixed-customer comparison until the old tariff is selected or verified manual rates are provided, and the offered tariff is selected.
- Publish a separate version-pinned customer renewal layout demo. Live Apps Script integration is still pending.

## v2.78.1 - 27th October 2026 (simplified preview; not production)
- Reduce existing-customer renewal setup to four prominent choices: expiring fixed tariff, fixed offer in email, current monthly Direct Debit/Budget Plan, and estimated annual electricity/gas usage.
- Move region, qualifying services, start date, optional name and Variable/Fixed selector into one collapsed **Region & services** section at the top, with the current region/service combination visible in its summary.
- Use direct kWh entry by default; keep sliders as an optional adjustment.
- Present three likely tariffs with full-dropdown fallbacks for both existing and offered tariffs.
- Collapse manual unit-rate entry; display a short loaded-tariff confirmation rather than all four rates.
- Remove the duplicated £155-style monthly Budget Plan paragraph from the results without changing the payment reference used by the chart.
- Clarify offered buttons as **Fixed Saver / Fixed / Fixed Start**, not a technical "suite" label.
- Regression tests verified on isolated branch; customer-facing production feed still requires explicit review and Apps Script deployment.

## v2.77.2 - 27th October 2026 (preview; not production)
- Move the historical tariff selector directly beneath the **Fixed** choice in the existing-customer builder.
- Show three likely expiring tariffs first, with the complete historical dropdown underneath.
- Keep VAT-inclusive manual-rate entry collapsed behind a fallback, not as the default workflow.
- Display the chosen tariff's four regional source rates automatically.
- Date pre/post-April 2026 rate revisions by their applicable 1st April boundary rather than relying on ambiguous source-reference dates.
- Keep the customer-facing production calculator unchanged until the Apps Script historical feed is deployed and checked.

## v2.77.0 - 27th October 2026 (preview branch; not deployed)
- Preserve separate pre- and post-April 2026 Fixed, Fixed Saver and Fixed Start rate versions by unique IDs, rather than deduplicating by UW's non-unique source reference.
- Display version labels in the full historical tariff dropdown.
- Retain the existing three-button near-expiry quick selector and prefer post-April rate versions when available.
- Deduplicate a pair of rate-identical Fixed Saver 81 documents in the UI without erasing the original PDF evidence.
- Share URLs retain the uniquely selected tariff version.
- The deployed Apps Script must add the Historical_Fixed tab to `?mode=renewal` before live use; until then this is a staged preview, not a production release.
