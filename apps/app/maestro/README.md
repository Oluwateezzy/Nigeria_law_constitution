# Maestro journeys

These flows cover launch without an account, reading the next section, search, a note, Ask, and a scenario citation.

Build the iOS or Android app with `EXPO_PUBLIC_AI_DOUBLE=1` before the Ask and scenario flows. That flag returns a scripted explanation and does not call the hosted model or an own key.

`appId` is the local variant, `com.nigerialaw.reader.local`. Preview and production builds use the identifiers in `src/config/variants.cjs`.

The CI runner is Ubuntu and does not host an iOS simulator or an Android emulator, so these flows are not a CI job. Run them on a simulator or a device and keep the recordings with the release notes. No recording is attached from this environment.
