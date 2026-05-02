# Release Signing Prep

## Current Android app info
- Application ID: `com.bruce.expensetracker.redo`
- Version code: `1`
- Version name: `1.0`

## What is needed before release signing
You need to provide one of these:

1. **Existing keystore**
   - keystore file path
   - key alias
   - store password
   - key password

2. **Or ask to generate a new keystore**
   Then decide:
   - organization / owner name
   - validity period
   - where to store the keystore safely

## Suggested release outputs
- Signed release APK
- Signed AAB for Play Store upload

## Recommended next steps
1. Confirm whether to use an existing keystore or create a new one
2. Add signing config securely, preferably via local secrets or `gradle.properties`
3. Build:
   - `assembleRelease`
   - `bundleRelease`
4. Verify install / upload

## Notes
- Current debug APK is for testing only
- Do not commit keystore files or passwords into git
- If using Play App Signing, still keep the upload keystore backed up safely
