# Historical renewal preview changelog

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
