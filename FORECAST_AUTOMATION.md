# Approved MoneySavingExpert forecast feed

## Purpose

One reviewed JSON file, `forecast-data.json`, supplies all the January, April and
July forecasts used by Should I Fix, the January default and its tappable source
table (including the EDF, British Gas and E.on Next rows). The built-in October
2026 snapshot remains available when the JSON feed cannot be loaded.

## Friday check and conditional Saturday follow-up (monitor v1.1)

- GitHub Actions workflow: `.github/workflows/mse-forecast-review.yml`.
- Runs **Friday at approximately 5pm UK time**, in GMT or BST.
- Fetches MSE's public energy price cap prediction page and verifies that the
  current four-quarter table is readable, including missing supplier figures where explicitly marked as unavailable. The MSE average must be complete.
- If any numerical forecast changes, generates or refreshes a pull request named
  **Approval requested: updated MSE energy forecasts**, for manual approval.
- If no numbers change, creates a Friday GitHub issue assigned to `aqcroft`
  titled **MSE forecast check: [date] - no updates found**. With issue-assignment
  email enabled, this provides the requested **no updates found** email.
- The **Saturday 5pm UK** run checks again **only if that Friday no-change issue
  is open**. It records the follow-up result on the same issue, then closes it.
  If fresh numbers appear on Saturday, it also creates an approval pull request.
- If Friday already discovered a change, Saturday skips the redundant recheck.
- Missing, inaccessible, old or restructured MSE data **fails closed**. The
  currently approved published forecast is untouched. A failed check does not
  claim that there were "no updates found" and should surface as an Actions failure.
- A separate ChatGPT backup watch also checks Fridays and Saturdays for *changed
  figures only*. GitHub handles Friday's "no updates" notification to avoid duplicates.

## Approve an update

1. GitHub account **aqcroft** is requested as a reviewer. Check the GitHub
   notification email or https://github.com/notifications.
2. Open the proposed pull request and check the numerical table and MSE link.
3. Select **Merge pull request** and **Confirm merge**. That publishes the
   approved JSON to the `main` branch. A data-only forecast change does not need a new app version; a bundled code or UI change does.
4. To reject it, **Close pull request** without merging.

The source data change and approval are recorded permanently in Git history.
The workflow `.github/workflows/mse-forecast-published.yml` then waits until
the public GitHub Pages JSON exactly matches the approved file before logging a
timestamped **Forecast published and verified** issue assigned to **aqcroft**.
This creates a GitHub notification (email only if account email notifications
are enabled). Publication notifications are not promises of immediate CDN
propagation before they have been verified.

## GitHub settings required

These need checking in GitHub. They are account/repository settings, not
settings that can be confirmed from repository source files alone.

1. Under the **ShouldIFix repository → Settings → Actions → General → Workflow
   permissions**, allow read and write access for GitHub Actions and enable
   **Allow GitHub Actions to create and approve pull requests**. If repository
   policies prevent this, a different bot credential would be required.
2. Under your GitHub **Settings → Notifications**, enable email for requested
   pull-request reviews and issue assignments. Check the verified account email.
3. Leave Actions enabled for the ShouldIFix repository. You can manually run
   the forecast workflow from its Actions tab to test the scraper. Manual runs
   can propose a changed forecast, but do **not** generate scheduled Friday
   no-change emails or trigger the Saturday follow-up.
4. **Test the approval email:** open the repository **Actions** tab, select
   **Test forecast approval email (no data changes)**, choose **Run workflow**,
   and wait for the run to complete. GitHub's automation bot creates a harmless
   pull request and requests an `aqcroft` review, which should generate an
   email if notifications are enabled. Once reviewed, **close it without
   merging**. This test changes no live forecast data.
5. If no email arrives, inspect https://github.com/notifications and the
   workflow run first. Self-authored pull requests cannot request a review
   from the same person; the test must be run by GitHub Actions, not created
   manually under the owner's login.

## Sharing and safety

- Public/customer links using the default forecast omit the `j` URL parameter
  and follow newly approved forecasts.
- An explicitly chosen scenario retains its `j` value. Older shared links with
  `j` remain pinned to their original selection.
- The forecast button remains one of four options:
  **0%, 15%, [approved January forecast]%, 30%**.
  If the forecast duplicates one of the other buttons, 25% is kept instead;
  duplicates are not presented.
- The feed refreshes when the calculator opens and uses a cache-busting URL.
- A fetched JSON document must pass schema and range checks before use.
- The initial built-in data is the week of **12 October 2026**. Subsequent revisions are stored in `forecast-data.json`.
- An unusual future source-table change, confirmed quarterly cap replacement,
  or model change should be reviewed before adapting the scraper. This
  automation deliberately does not extrapolate beyond its supported quarters.

Source: https://www.moneysavingexpert.com/utilities/energy-price-cap-prediction/

## Changelog

- **28 October 2026 - standalone v2.66.7:** Prepared MSE forecasts for the week starting 25 October from a user-supplied screenshot and a direct source cross-check. Updated the parser for unnumbered supplier rows and British Gas's four unavailable forecasts, and corrected the table's missing-date display. The GitHub Actions HTTP 403 from MSE remains a separate source-access issue; these changes do not bypass it.
- **Manual screenshot fallback:** If the MSE endpoint blocks automated requests, submit a clear screenshot of the complete table in ChatGPT for comparison and preparation of a reviewable GitHub pull request. The forecast must not be automatically published without approval.
