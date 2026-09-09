# SF Stairway Spotter — Build 13 Handover

## Goal

Prepare iOS Version 1.0, Build 13 as a small, focused update that adds the new
username and friend-request experience to the native app. Do not add the
post-launch roadmap features to this build.

## Project location

The active repository is:

`/Users/alexandrakenin/Downloads/sf-stairway-spotter`

Work on the `main` branch. Before changing anything, inspect the working tree
and preserve all unrelated files and edits.

## Build 12 baseline

- iOS Version 1.0, Build 12 was uploaded to App Store Connect and processed.
- Build 12 passed the production build, automated tests, native compilation,
  upload, and Alexandra's main real-device smoke tests.
- Build 12 does not contain the username/friend-request changes listed below.
- The live web app may be ahead of the Build 12 native binary.
- Current iOS build number in the Xcode project is 12 and must become 13 for the
  new upload.

## Changes intended for Build 13

Commits already recorded on `main`:

- `c82d0a9 Improve username and friend request flow`
- `1e7d06f Refine friend request responses`

The feature behavior is:

1. Username is visible and editable under **Menu → Settings**.
2. A person must create a username before sending a friend request.
3. The Friends screen says: **“Add a username before sending requests so
   friends know who you are.”**
4. After sign-in, a new incoming request produces a one-time alert containing
   the sender's username and email, with **Later** and **View request** actions.
5. **View request** opens Friends, where the recipient can accept or decline.
6. Accepting makes both accounts friends and shows a brief confirmation to the
   recipient.
7. Declining quietly deletes the pending request and confirms the action only
   to the recipient. The sender receives no rejection notification and returns
   to the neutral state in which they may send a future request.
8. Seen request IDs are stored per signed-in user so the same incoming alert is
   not repeatedly shown.

Relevant files:

- `src/App.jsx`
- `src/components/FriendsModal.jsx`
- `src/components/SettingsModal.jsx`
- `src/friendRequests.js`
- `src/friendRequests.test.js`
- `src/index.css`

## Additional fixes approved for Build 13

- Public Support, Privacy, Terms, and Delete Account pages use normal document
  scrolling so iOS Safari no longer snaps away from the top of the page.
- New-stairway alerts remain pending until the person dismisses the alert or
  opens one of the newly added stairways.
- Spotted remains an unlimited private checklist and no longer awards badges.
- Future badge awards and visible badge progress use unique stairways in the
  signed-in person's verified-visit history. Badges already earned are retained.
- The verified milestone sequence now includes **High Five** at five unique
  verified stairways and **Ten Pack** at ten.
- Neighborhood badges are alphabetical. Stats groups neighborhoods by **Closest
  to completing**, **In progress**, **Completed**, and **Not started**.

## Other code already after the Build 12 baseline

These commits are also on `main` and should remain in Build 13 unless Alexandra
explicitly changes scope:

- `c1fa379 Improve mobile verification reliability`
- `e1af3e7 Clarify location and verification privacy`
- `1c58de8 Document post-launch roadmap and launch gate` (documentation only)

Review the complete diff from `508c3ca` (the Build 12 preparation commit) to the
Build 13 candidate before syncing native assets.

## Files that do not belong to the release

The following untracked files predate this handover and must remain untouched
and uncommitted unless Alexandra explicitly asks otherwise:

- `.idea/`
- `android/.idea/`
- `src/assets/landing/badges-v2.jpg`

Do not clean, delete, or add them while preparing Build 13.

## Required implementation and verification

1. Confirm the intended source commits and inspect the full Build 12-to-13 diff.
2. Add or improve automated coverage for accepting, declining, notification
   suppression, and username gating where practical.
3. Run the complete test suite and production build.
4. Change both iOS `CURRENT_PROJECT_VERSION` entries from 12 to 13.
5. Sync the final production web bundle into the iOS project.
6. Compile/archive the exact Build 13 candidate and verify signing,
   entitlements, permission descriptions, OAuth callbacks, and bundle identity.
7. Do not upload until Alexandra explicitly approves the exact candidate.
8. After upload, wait for App Store Connect processing and select Build 13.
9. Do not release it to external testers until Alexandra explicitly approves.

## Build 13 real-device checks

In addition to the normal release checklist, test the complete two-account
Friends flow on the actual candidate build:

- A new user can find where to create a username in Settings.
- Without a username, Add Friend is disabled and the approved explanation is
  shown.
- After adding a username, a request can be sent by email.
- The sender sees the request as pending.
- The recipient sees the one-time new-request alert after sign-in; it includes
  the correct username and email.
- **Later** closes the alert without losing the pending request.
- The same request does not create the same alert repeatedly.
- **View request** opens the correct Friends screen.
- Accept makes both accounts friends and the accepted state survives relaunch.
- Decline removes the request, gives the recipient confirmation, produces no
  rejection alert for the sender, and allows a later new request.
- Canceling a sent request still works.
- Removing, blocking, unblocking, and reporting a user still work.
- Friend indicators and any friend-dependent leaderboard behavior remain
  correct.

Also rerun the core smoke checks for map loading, location, check-in, photo
verification, progress, filters, account persistence, sign-in, and sign-out.

## Known risk worth testing

If practical, interrupt connectivity after taking a verification photo, then
reconnect and test **Retry verification** without retaking the photo. This was
not completed during the Build 12 device test.

## App Store submission items still to confirm

- Permanent demo email/password account with representative data.
- App Review notes explaining anonymous map browsing and physical-proximity
  verification.
- Short reviewer screen recording for the location-dependent flow.
- App Privacy answers matching all data transmitted to Supabase, Google, and
  other providers.
- Working privacy, support, terms, and account-deletion URLs.
- Complete screenshots, description, age rating, reviewer contact, support
  contact, and export-compliance answers.

## Deferred roadmap — not Build 13

See `ROADMAP.md`. In particular, do not add nearby-stairway notifications,
first-check-in recognition, a friends activity feed, or AI-generated routes to
this release.

## Suggested opening message for the new Codex chat

> Please prepare SF Stairway Spotter Version 1.0, Build 13 using
> `/Users/alexandrakenin/Downloads/sf-stairway-spotter`. Read
> `BUILD_13_HANDOFF.md` and `RELEASE_CHECKLIST.md` completely before making
> changes. Build 13 should include the username and friend-request flow already
> committed on `main`. Preserve the listed unrelated untracked files. Audit the
> exact Build 12-to-13 diff, run all automated and native checks, and stop for my
> explicit approval before uploading or releasing anything.
