# SF Stairway Spotter launch operations

## App Store submission checklist

- Confirm the production build number and version.
- Confirm Support, Privacy Policy, Terms of Use, and Delete Account links on a physical iPhone.
- Complete the App Privacy questionnaire from the production data practices.
- Confirm the age rating questionnaire.
- Confirm the support contact, review contact, copyright, category, and availability.
- Keep the Apple review account active, with representative Spotted and verified progress, badges, leaderboard participation, and an accepted friend.
- Verify every backend service and database migration is live before submission.
- Verify email sign-up, email confirmation, sign-in, password reset, Apple sign-in, Google sign-in, sign-out, and account deletion.
- Verify denied camera and location permissions produce useful recovery instructions.
- Verify the Explorer purchase, Restore Purchases, reinstall/device restoration, and revoked/refunded entitlement behavior.
- Make premium features and prices clear in the App Store description and screenshots.

## Public-link device test

Test these links from Settings and the app menu on a physical iPhone:

- Support
- Privacy Policy
- Terms of Use
- Account deletion information
- Password-reset email link

For each page, check initial scroll position, text size, rotation, browser Back behavior, and every link on the page.

## Stairway corrections and safety-report review

Owner: Alexandra Kenin, or a named backup when Alexandra is unavailable.

- Launch week: check stairway corrections and user reports every day.
- After launch: check at least Monday, Wednesday, and Friday.
- Treat credible threats, targeted harassment, exposed personal information, and unsafe or private stairway reports as urgent.
- Record the date reviewed, decision, action taken, and any follow-up needed.
- Do not promise a response time publicly unless it can be maintained.
- Support and reporting are not emergency services.

## Database protection and recovery

- Confirm which automatic backup and point-in-time recovery features are active in the Supabase plan.
- Keep every schema change as a reviewed migration in source control.
- Export a restorable database backup before launch and before every production migration.
- Keep a second protected copy outside the production project.
- Test restoring into a non-production project before launch, then at least quarterly.
- Never test destructive account or data operations against the only production copy.
- After a data incident, pause writes if needed, preserve logs, identify the affected interval, restore or repair in a non-production environment first, and document the outcome.

## Release-day monitoring

- Check authentication, map loading, verification, purchases, and account deletion after release becomes available.
- Review incoming feedback, stairway corrections, and safety reports daily during launch week.
- Keep the previous working build and database backup available for comparison.
- Record production changes and incidents in a dated release log.
