# Should I Fix? - changes

## v2.66.22 - 19 November 2026
- Corrected the initial v2.66.21 preview where peak-month bills appeared in badges instead of monthly averages.
- Condensed the Current forecast area into a single heading with percentage and pence-per-kWh selectors.
- Percentage remains the default; only the selected method's six scenario choices are shown.
- Pence mode displays only the relevant electricity and/or gas rows, without redundant visible labels or explanations. Both fuel choices retain accessible names.
- Positioned monthly average £ labels on the chart near the seasonal peaks, using the same full-calendar-month-equivalent average previously shown in the legend; removed monthly amounts from the side legend.
- Ordered the legend from highest to lowest cost over the same pro-rated comparison period.
- Preserved regional tariff calculations, forecast rate precision, default assumptions and annual/quarterly savings maths.

Testing: the main embedded JavaScript compiles; forecast-control modes were checked in dual, electricity-only and gas-only configurations; the compute() calculation was verified unchanged. Visual/manual mobile and desktop browser review is still required before production merge.

Review-only hosted preview: https://aqcroft.github.io/ShouldIFix/forecast-preview-v26622.html
