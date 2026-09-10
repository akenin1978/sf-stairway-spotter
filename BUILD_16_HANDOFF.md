# SF Stairway Spotter — Build 16 Handover

## Goal

Use Build 16 as the next focused iOS candidate after the successfully uploaded
Build 15. Begin by confirming whether Build 16 is another internal TestFlight
build or the final App Store submission candidate. Do not upload, release to
testers, publish the website, or change production data without Alexandra's
explicit approval.

## Project location

The active repository is:

`/Users/alexandrakenin/Downloads/sf-stairway-spotter`

Work on the `main` branch. Inspect the working tree before making changes and
preserve all unrelated files.

## Build 15 milestone

- iOS Version 1.0, Build 15 was archived, signed, and successfully uploaded to
  App Store Connect on September 9, 2026. The upload reported that Apple's
  processing had begun; confirm its current TestFlight processing status.
- Build 15 source through commit `12ff539` is pushed to `origin/main`.
- Build 15 passed 146 automated tests across 31 files before upload, the
  production build, Capacitor sync for iOS and Android, an unsigned Release
  compile, and a signed archive.
- The archive metadata was Version 1.0, Build 15.
- The live Support, Privacy, Terms, and Delete Account pages were tested after
  deployment. All returned successfully and opened with their page heading at
  the top through their `#top` URLs.
- Live Supabase functions and permissions were checked for account deletion
  and streak history. `delete_my_account` and `get_my_streak` are private to
  authenticated users. The streak migration combines legacy check-ins with
  verified-visit history using San Francisco calendar weeks.
- A real account was deliberately not destroyed during automated checks. A
  disposable account is still required for a complete end-to-end deletion
  test.

## Important Build 15 behavior

- Incoming friend-request alerts no longer expose the sender's email address.
  They show the username or the fallback “A stairway spotter.”
- The Build 15 Friends interface requires a username before sending a friend
  request.
- That username rule is currently enforced by the Build 15 interface, not by a
  production database rule. An older beta build could potentially bypass it.
  Add server-side enforcement before public launch if practical.
- Badge progress uses lifetime unique verified stairways and no longer falls
  back to a partial count after 100.
- Spotted remains an unlimited private checklist; verified visits earn badges,
  leaderboard progress, repeat-visit history, and mayorship eligibility.
- The map action now says **Nearby stairs**. Verification requires a genuinely
  fresh, sufficiently accurate location and provides **Try location again**
  when a reliable reading is unavailable.
- Support, Privacy, Terms, and Delete Account links use their `#top` URLs.
- Account deletion opens the in-app deletion and identity-confirmation flow,
  rather than merely opening the public instructions page.

## Work completed locally after Build 15

The following three commits are on local `main` but have not been pushed to
`origin/main` and are not part of the uploaded Build 15 binary:

- `ff2bb34 Invite friends who have not joined yet`
- `0e91804 Prepare friend invitations and store download links`
- `f81e2ae Route friend invites to the join page`

Together they add:

1. If an entered email belongs to an existing account, the normal in-app friend
   request is sent.
2. If no account matches, the app offers **Send invitation** instead of showing
   an unhelpful “not found” error.
3. The native iPhone/Android share sheet lets the sender choose Messages, Mail,
   or another installed sharing app.
4. External invitation copy begins “Your friend invited you…” and does not
   expose or rely on the sender's username, email address, contacts, or real
   name.
5. A username is still required before the invitation option is available.
6. A lookup connection failure is distinguished from a genuine non-user and
   shows a retry-oriented message.
7. Friend invitations point to `https://www.sfstairwayspotter.com/join`.
8. A prepared `/join` webpage explains the invitation, offers the web map, and
   shows an honest pre-launch state while store links are unavailable.
9. Homepage and `/join` download controls remain hidden until a real public
   store URL is entered in `src/storeLinks.js`.
10. Adding the App Store URL will show the iPhone download controls and retain
    “Android coming soon.” Adding the Google Play URL later will show both.
11. Capacitor's official Share plugin is installed and synced into both native
    projects.

After this work, the full suite passes: **149 tests across 33 files**. The
production build and Capacitor sync for both iOS and Android also pass. The
existing non-failing JavaScript bundle-size warning remains.

## Decisions made but not implemented

- Keep both map controls:
  - the small crosshair only recenters the map;
  - the larger **Nearby stairs** button begins the nearby-stairway flow.
- Add a one-time tooltip reading **Your location** for the crosshair.
- Keep the crosshair's VoiceOver label descriptive: **Center map on my
  location**.
- Do not request Contacts access for Version 1.0. Friend discovery remains by
  email; invitations use the user's chosen sharing app.
- Add official App Store and Google Play download links only after each public
  listing exists. Do not publish dead or guessed store URLs.

## Files that do not belong to the release

These untracked files predate Build 16 preparation and must remain untouched
and uncommitted unless Alexandra explicitly asks otherwise:

- `.idea/`
- `android/.idea/`
- `src/assets/landing/badges-v2.jpg`

Do not clean, delete, or add them.

## Recommended Build 16 scope

Start by reviewing the three local commits above. Then:

1. Implement and test the one-time **Your location** tooltip and confirm the
   crosshair already has the intended VoiceOver label.
2. Add server-side username enforcement for new friend requests and invitations
   so older builds cannot create anonymous requests. Decide how existing
   anonymous pending requests should be displayed or cleaned up without
   deleting legitimate data unexpectedly.
3. Real-device test the new invitation flow:
   - existing account receives an in-app request;
   - unknown email offers an invitation;
   - Messages and Mail can be selected from the native share sheet;
   - canceling the share sheet is harmless;
   - the invitation opens `/join`;
   - username gating remains clear.
4. Visually test `/join` on iPhone and desktop. Keep store buttons hidden until
   the corresponding public listing URL is known.
5. Decide whether Build 16 includes the Explorer purchase system. The public
   launch plan previously called for a $6.99 October lifetime promotion,
   enforcement after 10 unique verified stairways, clear unlock copy, Restore
   Purchases, cross-device recovery, and refund handling. Do not ship a partial
   purchase implementation.
6. Complete the standard release checklist and a real-device regression pass,
   paying particular attention to account deletion, sign-in transition,
   location freshness, badges above 100, Friends, public links, and interrupted
   connectivity.
7. Change both iOS `CURRENT_PROJECT_VERSION` entries from 15 to 16 only when the
   exact candidate scope is approved.
8. Stop for Alexandra's explicit approval before pushing the three local
   commits, publishing `/join`, archiving/uploading Build 16, or releasing it to
   testers.

## Build 16 real-device checks

- Confirm Build 15 first if it has not yet received a short internal smoke test.
- Force-close and reopen; confirm the app remains signed in and the map loads.
- Confirm sign-in no longer causes the visible screen jump.
- Tap the crosshair and confirm it only recenters the map.
- Tap **Nearby stairs** and confirm nearby choices are understandable.
- Test a delayed or inaccurate GPS result and the **Try location again** path.
- Mark one stairway Spotted and verify one visit with the camera.
- Confirm the header's verified total and milestone badges agree above 100.
- Confirm incoming friend alerts never display email addresses.
- Confirm a username is required before sending a request or invitation.
- Test existing-user request, unknown-user invitation, accept, decline, cancel,
  remove, block, unblock, and report behaviors with two accounts.
- Test in-app account deletion completely with a disposable account, including
  signing in again afterward to prove the account is gone.
- Open Support, Privacy, Terms, and Delete Account from the installed app and
  confirm each starts at its heading.
- Test poor connectivity for sign-in, Spotted saves, verification, friend
  actions, deletion, and purchases if purchases enter Build 16.

## App Store candidate items still requiring human confirmation

- Final App Store screenshots, including the corrected badge and Friends views.
- App Store description, keywords, category, age rating, copyright, support
  contact, reviewer contact, privacy URL, and support URL.
- App Privacy answers matching the production app and privacy policy.
- Permanent review account with useful representative progress.
- Review Notes explaining anonymous browsing, location/photo verification, and
  the 10-unique-verification purchase gate if included.
- Demo video or clear reviewer steps for the physical-location flow.
- Final public App Store URL. Once live, add it to `src/storeLinks.js`, test the
  homepage and `/join`, and only then publish the download links.
- A documented decision on when submitted stairway corrections and user reports
  are reviewed, plus purchase/refund support if Explorer launches.

## Suggested opening message for the new Codex chat

> Please prepare SF Stairway Spotter Version 1.0, Build 16 using
> `/Users/alexandrakenin/Downloads/sf-stairway-spotter`. Read
> `BUILD_16_HANDOFF.md` and `RELEASE_CHECKLIST.md` completely before making any
> changes. Build 15 was uploaded successfully; local `main` is three commits
> ahead with the friend invitation share sheet and prepared `/join`/store-link
> website work. Preserve the listed unrelated untracked files. First confirm
> Build 15's TestFlight status and help me agree on the exact Build 16 scope.
> Do not push, publish, upload, or release anything without my explicit
> approval.
