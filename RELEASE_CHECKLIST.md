# SF Stairway Spotter Release Checklist

Use this checklist before every TestFlight or Google Play build. A build is not
ready for testers until every required item is checked, marked not applicable,
or recorded as a known issue that Alexandra has explicitly accepted.

## 1. Define the build

- [ ] Record the version and build number.
- [ ] List every user-visible change in this build.
- [ ] Identify every existing feature touched directly or indirectly by those changes.
- [ ] Review the complete code difference from the last tester build.
- [ ] Confirm no unrelated or accidental files are included.

## 2. Automated checks — Codex

- [ ] Run the complete automated test suite; all tests pass.
- [ ] Run the production web build; it completes successfully.
- [ ] Run the iOS build/archive check when preparing an iOS build.
- [ ] Run the Android build check when preparing an Android build.
- [ ] Confirm required iOS and Android permissions and configuration are still present.
- [ ] Confirm the live database policies needed for sign-in, check-ins, verification,
      badges, friendships, reports, and account deletion are present.
- [ ] Add a regression test for every bug fixed in this build whenever it can be automated.

## 3. Core regression checks — Codex

### Launch and account

- [ ] The app launches without freezing or showing a System UI error.
- [ ] The map and all stairways load.
- [ ] A new account does not receive an old “new stairways” notice.
- [ ] A returning account receives the correct new-stairway notice and all new
      stairway thumbnails appear.
- [ ] Apple sign-in works on iPhone and is hidden on Android.
- [ ] Google sign-in works and returns to the app correctly.
- [ ] Email sign-in works.
- [ ] The user remains signed in after closing and reopening the app.
- [ ] Sign-out works.

### Map and browsing

- [ ] Markers, photos, descriptions, ratings, neighborhoods, and step counts display.
- [ ] Stairway cards open and close normally.
- [ ] The map remains within the intended San Francisco area while every stairway
      card can still be fully shown.
- [ ] The out-of-San-Francisco location message appears only when appropriate.
- [ ] Rating and neighborhood filters work and remain touch-scrollable.
- [ ] Badge lists and other long panels remain touch-scrollable.
- [ ] Nearby-stairway results show real thumbnails when photos exist.

### Location and check-in — mandatory for every build

- [ ] With location allowed, the location button centers the map correctly.
- [ ] With a valid map location already available, **Check In** reuses it and does
      not fail by unnecessarily requesting another GPS fix.
- [ ] With no cached location, **Check In** obtains a fresh location within a
      reasonable timeout.
- [ ] With location denied, the app shows an accurate, useful permission message.
- [ ] With location temporarily unavailable or timed out, the app shows an accurate
      retry message rather than a misleading permissions message.
- [ ] Inside San Francisco, **Check In** opens the correct nearby-stairway choice.
- [ ] Outside San Francisco, the boundary message appears and the map remains in bounds.
- [ ] **Mark as spotted** turns green, updates the count, and remains saved after relaunch.
- [ ] A failed spotted save displays an error instead of silently reversing the checkmark.
- [ ] Removing a spotted check-in works.

### Photo verification

- [ ] **Verify with a photo** opens the camera on a real phone.
- [ ] Verification works for an unspotted stairway.
- [ ] Verification works after the stairway was already marked spotted.
- [ ] Successful verification updates the verified count, leaderboard, and badges.
- [ ] Too-far, location, camera-permission, and save failures show the correct message.
- [ ] The temporary photo is not uploaded or retained.
- [ ] The privacy explanation can be dismissed and stays dismissed.

### Progress and community

- [ ] Spotted and verified totals are correct.
- [ ] Badges display, scroll, award correctly, and persist after relaunch.
- [ ] The leaderboard is ranked by verified count and its column headings align.
- [ ] The leaderboard shows the appropriate rank range for users outside the top 10.
- [ ] Friend indicators, reporting, and blocking still work.
- [ ] A verified visit is recorded after the camera and proximity checks pass.
- [ ] A second verification of the same stairway on the same SF calendar day
      does not add another visit.
- [ ] A verified visit on a later day appears in that stairway's private visit
      history.
- [ ] Exact visit dates and temporary camera photos are never shown publicly.
- [ ] Mayorship uses only eligible verified visits from the rolling 30-day
      window, keeps the incumbent on a tie, and updates the visits-needed text.
- [ ] A user needs at least two eligible visits on different days before a
      stairway awards its first mayorship.
- [ ] Users who have not joined the leaderboard see personal visit history but
      no mayor, crown, competition progress, or leaderboard invitation in the
      stairway card.
- [ ] Visits made while leaderboard participation is off never become
      mayorship-eligible retroactively.
- [ ] Turning off leaderboard participation shows the opt-out warning and
      Cancel leaves the setting enabled.
- [ ] Confirming opt-out removes the user's public leaderboard presence and
      mayorships without deleting private visit history or lifetime totals.
- [ ] Rejoining restores the user's regular leaderboard total and current rank,
      but previously eligible visits do not automatically restore a mayorship.
- [ ] A blocked user's display name is hidden from stairway mayorship details.
- [ ] Successful verification partially flips only the lower card, leaves the
      stairway name and reference photo in place, and keeps the card open.
- [ ] Reduced Motion skips the verification flip without delaying the result.

### Website and links

- [ ] `sfstairwayspotter.app` loads the app and does not redirect to a Vercel address.
- [ ] OAuth returns to `sfstairwayspotter.app` without an expired-state error.
- [ ] Support, privacy, terms, marketing, and account-deletion links open correctly.

## 4. Real-device smoke test — Alexandra

These checks must be performed on the actual tester build because a simulator
cannot fully prove real GPS, camera, native sign-in, or TestFlight behavior.

- [ ] Confirm the displayed build number is the intended build.
- [ ] Force-close and reopen the app; it loads and remains signed in.
- [ ] Tap the location button; the map centers on the current position.
- [ ] Tap **Check In**; nearby stairways appear without a location error.
- [ ] Mark one stairway spotted; close and reopen the app; it remains spotted.
- [ ] Verify a previously spotted stairway with a photo.
- [ ] Scroll the neighborhood filters and badges.
- [ ] Open the leaderboard and confirm counts and alignment look correct.
- [ ] Test the sign-in method changed by the build, if any.
- [ ] Report the result as **PASS** or send a screenshot of any failure.

Run the equivalent smoke test on a physical Android device before an Android
tester release once one is available.

## 5. Release gate

- [ ] Codex provides Alexandra a concise report containing:
  - build number;
  - changes included;
  - automated test and build results;
  - core regression results;
  - device checks still required;
  - known issues or risks.
- [ ] Alexandra confirms the real-device smoke test passed.
- [ ] Alexandra explicitly approves uploading the build.
- [ ] Upload the build, but do not add it to external testers yet.
- [ ] Confirm processing completes and the intended build is selected.
- [ ] Run one final internal TestFlight smoke test.
- [ ] Alexandra explicitly approves releasing it to external testers.
- [ ] Commit and push the exact released code when Alexandra requests it.

## Build record template

Copy this section for each release:

```text
Version/build:
Date:
Changes:
Automated tests:
Production build:
iOS/Android build:
Core regression result:
Real-device result:
Known issues:
Upload approved by Alexandra:
External tester release approved by Alexandra:
Git commit:
```

## In-progress release record

```text
Version/build: Build 11 candidate (number not yet assigned)
Date: August 30, 2026
Changes: Repeat verified visits, private per-stairway visit history, rolling
  30-day opt-in mayorships with a two-visit minimum, one qualifying visit per
  SF day, partial-flip verification results, dynamic mayorship gap, blocked-name
  privacy, confirmed mayorship forfeiture on leaderboard opt-out, and nearby
  Check In error isolation/thumbnail fallback.
Automated tests: PASS — 54 tests
Production build: PASS
iOS/Android build: Not created
Core regression result: Automated checks and 390px card-layout preview pass;
  full manual regression pending
Real-device result: Pending
Known issues: Supabase migration must be applied before enabling repeat visits;
  the migration has not yet been validated against the live database, and real
  GPS/camera plus cross-day behavior require a device check.
Upload approved by Alexandra: No
External tester release approved by Alexandra: No
Git commit: Not committed
```
