# Spotify True Shuffle

A lightweight frontend-only web app that generates genuinely randomized Spotify playlist orderings from a user's Liked Songs library, then syncs the order into one managed Spotify playlist.

## Prerequisites

- Node.js 20 LTS or newer
- npm
- A Firebase project
- A Spotify Developer app

## Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a Web app in Project settings.
3. Enable Authentication.
4. Enable the Google sign-in provider.
5. Enable Firebase Hosting for the project.
6. Copy the Web app config values into `.env.local`.

## Spotify Developer setup

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2. Add redirect URIs for every host you open the app on (must match the browser origin exactly):
   - `http://127.0.0.1:5173` (or your Vite dev URL)
   - `https://<your-project>.web.app` for Firebase Hosting
3. Copy the Spotify Client ID into `.env.local`.

The app sets Spotify's OAuth `redirect_uri` to **`window.location.origin` at runtime**, so you do not need a separate redirect env per environment as long as each origin is registered in the Spotify dashboard.

Required Spotify scopes:

```text
playlist-modify-private playlist-modify-public playlist-read-private user-library-read
```

## Environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

`VITE_ALLOWLIST_EMAILS` is a comma-separated list of Firebase Auth email addresses allowed into the app.

Spotify OAuth uses **`window.location.origin`** as the redirect URI at runtime, so the same build works locally and on Hosting. Register every origin you use in the Spotify app settings.

## Development

```bash
npm install
npm run dev
```

## Quality gates

Run these before considering a change complete:

```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deploy

After the quality gates pass:

```bash
firebase deploy --only hosting
```

The included `firebase.json` serves the Vite `dist/` directory and rewrites all routes to `index.html` so Spotify's OAuth callback can return to the app root.

## iOS Safari smoke test

After deploying to Firebase Hosting:

1. Open the deployed Firebase Hosting URL in iOS Safari.
2. Sign in with an allowlisted Google account.
3. Connect Spotify and approve the requested scopes.
4. Run a Pure Random shuffle on Liked Songs.
5. Confirm progress updates during fetch and sync.
6. Tap **Open in Spotify** and confirm the True Shuffle playlist opens in Spotify.
