# Approved MoneySavingExpert forecast feed

## Purpose

One reviewed JSON file, `forecast-data.json`, supplies all the January, April and
July forecasts used by Should I Fix, the January default and its tappable source
table (including the EDF, British Gas and E.on Next rows). The built-in October
2026 snapshot remains available when the JSON feed cannot be loaded.

## Friday workflow

- GitHub Actions workflow: `.github/workflows/mse-forecast-review.yml`.
- Runs each Friday at approximately 5pm UK time, with UTC/BST checks.
- Fetches MSE's public energy price cap prediction page and verifies that the
  current four-quarter table and all supplier and average figures are readable.
- Any changed numerical figures generate or refresh a pull request named
  **Approval requested: updated MSE energy forecasts**.
- No change means **no approval request**.
- Missing, inaccessible, old or restructured MSE data **fails closed**. The
  currently approved published forecast is untouched.

## Approve an update

1. GitHub account **aqcroft** is requested as a reviewer. Check the GitHub
   notification email or https://github.com/notifications.
2. Open the proposed pull request and check the numerical table and MSE link.
3. Select **Merge pull request** and **Confirm merge**. That publishes the
   approved JSON to the `main` branch; it does not need a new app version.
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
3. Leave Actions enabled for the ShouldIFix repository. You may manually run
   the Friday workflow from its Actions tab to test the scraper. If the MSE
   numbers have not changed, it will correctly create **no** pull request.
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
- The initial built-in data is the week of **12 October 2026**.
- An unusual future source-table change, confirmed quarterly cap replacement,
  or model change should be reviewed before adapting the scraper. This
  automation deliberately does not extrapolate beyond its supported quarters.

Source: https://www.moneysavingexpert.com/utilities/energy-price-cap-prediction/
