# SF Stairway Spotter Release Checklist

Use this checklist before every TestFlight or Google Play build. A build is not
ready for testers until every required item is checked, marked not applicable,
or recorded as a known issue that Alexandra has explicitly accepted.

## 1. Define the build

- [ ] Record the version and build number.
- [x] List every user-visible change in this build.
- [x] Identify every existing feature touched directly or indirectly by those changes.
- [x] Review the complete code difference from the last tester build.
- [x] Confirm no unrelated or accidental files are included.

## 2. Automated checks — Codex

- [x] Run the complete automated test suite; all tests pass.
- [x] Run the production web build; it completes successfully.
- [ ] Run the iOS build/archive check when preparing an iOS build.
- [x] Run the Android build check when preparing an Android build.
- [x] Confirm required iOS and Android permissions and configuration are still present.
- [ ] Confirm the live database policies needed for sign-in, check-ins, verification,
      badges, friendships, reports, and account deletion are present.
- [x] Add a regression test for every bug fixed in this build whenever it can be automated.

## 3. Core regression checks — Codex

### Launch and account

- [ ] The app launches without freezing or showing a System UI error.
- [ ] The map and all stairways load.
- [x] A new account does not receive an old “new stairways” notice.
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
- [x] With location temporarily unavailable or timed out, the app shows an accurate
      retry message rather than a misleading permissions message. Automated
      browser and native error-classification regressions pass; confirm once on
      the candidate build during the real-device smoke test.
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
- [x] The temporary photo is not uploaded or retained.
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
- [x] Turning off leaderboard participation shows the opt-out warning and
      Cancel leaves the setting enabled.
- [ ] Confirming opt-out removes the user's public leaderboard presence and
      mayorships without deleting private visit history or lifetime totals.
- [ ] Rejoining restores the user's regular leaderboard total and current rank,
      but previously eligible visits do not automatically restore a mayorship.
- [ ] A blocked user's display name is hidden from stairway mayorship details.
- [x] Successful verification partially flips only the lower card, leaves the
      stairway name and reference photo in place, and keeps the card open.
- [ ] Reduced Motion skips the verification flip without delaying the result.

### Website and links

- [x] `sfstairwayspotter.app` loads the app and does not redirect to a Vercel address.
- [ ] OAuth returns to `sfstairwayspotter.app` without an expired-state error.
- [x] Support, privacy, terms, marketing, and account-deletion links open correctly.

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
Version/build: Version 1.0, Build 11
Date: August 30, 2026
Changes: Repeat verified visits, private per-stairway visit history, rolling
  30-day opt-in mayorships with a two-visit minimum, one qualifying visit per
  SF day, partial-flip verification results, dynamic mayorship gap, blocked-name
  privacy, confirmed mayorship forfeiture on leaderboard opt-out, and nearby
  Check In error isolation/thumbnail fallback. GPS permission, timeout, disabled
  services, temporary-unavailability, and unknown errors now show distinct messages.
Automated tests: PASS — 61 tests
Production build: PASS
iOS/Android build: iOS Build 11 production bundle sync PASS and unsigned
  Release compile for a physical iPhone target PASS; Android debug compile
  PASS from the release audit. No signed archive/release upload has been created.
Core regression result: Automated checks, 390px card-layout preview, live
  domain/link checks, phone-size neighborhood scrolling, and GPS error-message
  regressions pass. Full manual regression remains pending.
Real-device result: Pending
Known issues: The repeat-visit/mayorship migration is applied and its two tables
  and two public app functions are verified. The full live database policy set
  has not yet been audited. Real GPS/camera, sign-in, persistence, badges, and
  cross-day behavior require a device check. The deployed marketing-site
  privacy/terms text is still the August 24 version until these changes deploy.
  The production build also retains its non-failing 598 kB JavaScript chunk
  size warning.
Upload approved by Alexandra: No
External tester release approved by Alexandra: No
Git commit: cf15bbe (local only; main is one commit ahead of origin/main)
```

## August 30 audit notes

- The complete change from tester Build 10 was reviewed. The local commit does
  not include `.idea/`, `android/.idea/`, or the unrelated untracked
  `src/assets/landing/badges-v2.jpg` file.
- Required iOS camera/location descriptions, Apple Sign In entitlement,
  non-exempt-encryption declaration, Google callback URL scheme, and Android
  camera/location permissions are present.
- iOS is assigned Build 11, contains the latest production web bundle, and
  compiles successfully in Release configuration for a physical iPhone target.
  It has not been signed, archived, or uploaded. Android still reports version
  code 1; its native shell passed the earlier debug compile.
- Local `/privacy`, `/terms`, `/support`, `/delete-account`, and `/welcome`
  pages render. Live `.app` loads the map without redirecting, and the live
  `.com` marketing/legal/support URLs open. `.app/welcome` returns 404, but it
  is not the configured marketing URL; the configured `.com` home page works.
- The live Google Map reports only the existing legacy Marker deprecation
  warning. It does not prevent the map from loading.
- The repeat-visit/mayorship migration ran successfully in live Supabase. A
  read-only verification confirmed `verified_visits`, `stairway_mayors`,
  `record_verified_visit(uuid)`, and `get_my_verified_visit_history(uuid)`.
  A broader live policy audit remains pending.
- Map-boundary, thumbnail, mayorship, privacy, and Reduced Motion code paths
  have automated or code-level coverage, but their end-to-end boxes remain
  unchecked until they are exercised against the migrated database and the
  actual candidate build.
- GPS errors are now classified centrally across map location, nearby Check In,
  photo verification, and stairway submission. Browser/native permission denial,
  timeout, disabled Location Services, and temporary unavailability have passing
  regression tests. One real-phone confirmation remains in the smoke test.
