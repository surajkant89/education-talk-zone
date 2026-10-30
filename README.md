# Education Talk Zone Certificate Verification

A React/Vite certificate verification app with exact-ID public reads and Firebase UID-allowlisted administration.

## Local setup

Use Node.js 22 or newer.

1. Create a Firebase project and register a Web app in Project settings.
2. Enable **Authentication → Sign-in method → Email/Password**. This app provides sign-in only; create administrator users from the Firebase console.
3. Create a **Cloud Firestore** database. Set the database location, then publish the rules in `firestore.rules` (or deploy them using the Firebase CLI).
4. Copy `.env.example` to `.env` and fill in the Web app configuration values. These are Firebase client configuration values, not service-account credentials.
5. Install and start the app:

   ```sh
   npm install
   npm run dev
   ```

Without valid Firebase configuration the app displays a setup error; it does not use mock certificate records.

## Trusted administrator access

Admin authorization is enforced by Firestore Security Rules using the exact Firebase Authentication UID configured in `firestore.rules`. Vite reads the same UID from that rules file at build time for login and route handling, so there is no second manually maintained UID. Frontend checks only control the interface; Firestore Rules are the actual security enforcement.

There is no public registration UI or account-creation call in this app. Firebase's Email/Password provider can still accept account-creation requests made directly to its public Identity Toolkit API; those accounts do not match the authorized UID and cannot list or change certificate records.

1. Create an Email/Password user in **Firebase Console → Authentication → Users** and copy its UID.
2. Replace `REPLACE_WITH_ADMIN_AUTH_UID` in `firestore.rules` with that exact UID.
3. Build the app. Vite extracts the UID from the `isAdmin()` rule; the build fails if no valid UID is configured.
4. In Firebase Authentication settings, configure authorized domains for local development and the deployed hosting domain.

## Certificate data and privacy

Private certificate records are stored in `certificates`, and approved verification fields are mirrored into `publicCertificates`. Both records use their verification ID as the document ID. The app creates and updates each pair in Firestore transactions. Public clients can get one `publicCertificates` document for an exact ID, never list or write. Anyone who has a certificate's ID can read the approved display fields; do not put additional sensitive information in public records.

IDs use a cryptographically secure random suffix. A Firestore transaction checks and atomically creates the candidate document, so a collision is retried and an existing certificate is never overwritten. Creation/update timestamps are Firestore server timestamps. Revocation is permanent through the application; issued certificates are not deleted.

## Build and Firebase Hosting deployment

Install the Firebase CLI and authenticate, select the project, then build and deploy:

```sh
npm install
npm run build
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,hosting
```

Set the same `VITE_FIREBASE_*` variables in the build environment before building for production. `firebase.json` deploys `dist` and rewrites SPA paths (including `/verify/...` and `/etz-control-panel`) to `index.html`. Rebuild after changing environment variables. App Check is optional: configure a reCAPTCHA v3 site key and set `VITE_FIREBASE_APPCHECK_SITE_KEY` to initialize the client integration, then configure the provider and enforcement for Firestore and Authentication in Firebase Console.

## Security notes

- Firestore rules, not React route guards, enforce certificate/admin access.
- Public exact reads intentionally expose only the certificate details shown on the verification page to a person who knows the random verification ID. Firestore rules cannot return only selected fields from a document.
- Public self-registration, public certificate listing/writes, permanent deletion, custom admin claims, and frontend service-account credentials are not used.
- App Check is an additional abuse control, not a replacement for the authorization rules.
