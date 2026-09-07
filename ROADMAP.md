# SF Stairway Spotter Roadmap

This file records ideas that are intentionally not required for the initial App
Store launch.

## Post-launch features

### Nearby-stairway alerts

- Offer an optional notification when someone is near a mapped stairway.
- Keep the feature off by default and provide a clear on/off setting.
- Avoid repeated or noisy alerts with distance, timing, and recently-alerted
  limits.
- Request notification permission only after the person chooses to enable the
  feature and explains its value.
- Before implementation, review the battery, background-location, privacy-label,
  permission-copy, and App Store implications.

### First check-in recognition

- After a successful check-in, celebrate when the person is the first recorded
  visitor to that stairway.
- Decide whether this means first spotted visit or first verified visit. A first
  verified visit is more meaningful and harder to claim accidentally.
- Possible later social extension: a lightweight friends activity feed inspired
  by Foursquare/Swarm.
- Friends activity must be opt-in and should not reveal exact visit times or
  location history without clear consent.

### AI-powered stairway routes

- Let someone request a route based on a target stairway count, distance, or
  neighborhood.
- Consider accessibility, hills/elevation, route safety, closures, stairway
  condition, and a way to reroute.
- Label generated routes as suggestions and avoid implying that conditions are
  guaranteed current.
- Start with deterministic route generation where possible; use AI for useful
  explanations and personalization rather than inventing geographic facts.

## Current launch gate

None of the three features above is required for launch.

Before App Store submission, confirm the remaining release requirements:

- App Review has a permanent demo email/password account with representative
  activity and working credentials for the entire review period.
- App Review notes explain that map browsing works without signing in and that
  verification normally requires physical proximity to a mapped San Francisco
  stairway; include a short screen recording for the location-dependent flow.
- App Privacy answers match every category transmitted to Supabase, Google, or
  another provider, including account identifiers, submissions, and any precise
  location used for stairway suggestions.
- Privacy policy, support URL, terms, and account-deletion page are publicly
  reachable and match the shipped behavior.
- In-app account deletion works and removes or anonymizes the promised data.
- Permission descriptions for camera and location accurately explain why access
  is requested; temporary verification photos remain on-device only.
- Sign in with Apple is offered wherever another third-party sign-in option is
  offered, and Apple, Google, email sign-in, sign-out, and session persistence
  work in the submitted build.
- The exact submitted build passes the real-device smoke test for map loading,
  location, check-in, verification, progress, friends, blocking/reporting,
  filters, and relaunch behavior.
- The new username and friend-request flow is either included in the submitted
  native build and retested or explicitly deferred to the next build; the live
  web app alone does not update an already-uploaded iOS binary.
- Screenshots, description, age rating, support contact, reviewer contact, and
  export-compliance answers are complete in App Store Connect.

## Deferred test worth completing

- Interrupt connectivity after taking a verification photo, reconnect, and
  confirm **Retry verification** works without requiring a new photo.

