# FitDiary

FitDiary is an Expo + React Native fitness tracker built for fast daily logging, clear progress visibility, and a more social fitness experience. The app currently supports workouts, meals, hydration, streaks, reminders, goals, profile photos, friend-circle invites, and an AI-ready meal photo estimation flow.

## Product Overview

FitDiary is designed around a simple loop:

1. Log workouts, meals, and hydration quickly.
2. Stay consistent through streaks, goals, and reminders.
3. Build a friend circle and compare progress on the leaderboard.
4. Reduce meal logging friction with nutrition suggestions and photo-based estimation.

The current app is local-first on the device, with backend-ready foundations for social sync and AI meal-photo analysis.

## Current Features

### Core Tracking

- Workout logging with create, edit, and delete flows
- Meal logging with create, edit, and delete flows
- Hydration tracking with daily progress
- Daily streak calculation based on workout history
- Goal selection with local progress feedback
- Reminder scheduling for workouts, fuel, and hydration

### UX and Personalization

- Cutting-edge dark visual system with branded cards and strong hierarchy
- Keyboard-safe bottom-sheet style modals
- Profile photo upload
- Unit-aware placeholders such as `Calories (kcal)` and `Protein (g)`
- Heuristic meal suggestions for common foods when users do not know the macros

### Social Layer

- Friend-circle invite flow
- Native share support for WhatsApp and other apps
- Leaderboard with avatar support
- Local active vs pending friend states

### AI Meal Photo Flow

- Take a meal photo or choose one from the library
- Preview the image before saving
- Send the photo to a backend proxy for nutrition estimation
- Prefill meal name, calories, protein, carbs, and fat
- Graceful fallback when the photo service is unavailable

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81.5
- TypeScript
- AsyncStorage for local persistence
- `expo-image-picker` for profile and meal photos
- `expo-notifications` for reminders
- Expo EAS for iOS builds and TestFlight
- Node.js backend proxy for AI meal-photo estimation

## Project Structure

```text
FitDiary/
|-- App.tsx
|-- app.json
|-- eas.json
|-- Dockerfile
|-- render.yaml
|-- server/
|   `-- vision-proxy.mjs
|-- scripts/
|   |-- load-env-and-run.ps1
|   |-- start-expo-env.ps1
|   `-- start-vision-server.ps1
|-- src/
|   |-- components/
|   |   `-- ModalShell.tsx
|   |-- constants/
|   |   `-- appData.ts
|   |-- screens/
|   |   |-- AuthScreen.tsx
|   |   |-- DashboardScreen.tsx
|   |   |-- LogsScreen.tsx
|   |   `-- ProfileScreen.tsx
|   |-- services/
|   |   `-- fuelVision.ts
|   |-- styles/
|   |   `-- appStyles.ts
|   |-- theme/
|   |   `-- palette.ts
|   |-- types/
|   |   `-- app.ts
|   `-- utils/
|       `-- appHelpers.ts
|-- assets/
|-- package.json
`-- tsconfig.json
```

## Local Data Model

The app currently stores data locally with user-scoped AsyncStorage keys. This prevents one local profile from inheriting another profile's records on the same device.

Persisted local data includes:

- workouts
- meals
- hydration amount
- hydration day key
- friend-circle members
- reminder settings
- selected goal
- signed-in local user profile

## AI Meal Photo Architecture

The app does not call a hosted vision model directly from the device. Instead, it uses a small backend proxy so secrets stay on the server.

### App Side

The mobile app expects:

```text
EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT
```

This endpoint is used by [`src/services/fuelVision.ts`](./src/services/fuelVision.ts).

### Server Side

The repo includes a Node proxy in [`server/vision-proxy.mjs`](./server/vision-proxy.mjs).

It:

- accepts a base64 image payload
- calls a hosted multimodal model
- normalizes the response
- returns `label`, `calories`, `protein`, `carbs`, `fat`, `confidence`, and `notes`

### Environment Variables

Copy [`.env.example`](./.env.example) to `.env` and set:

```text
EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT=http://localhost:8787/estimate-fuel
HF_TOKEN=hf_your_token_here
FITDIARY_VISION_MODEL=Qwen/Qwen2.5-VL-7B-Instruct
FITDIARY_VISION_BASE_URL=https://router.huggingface.co/v1/chat/completions
```

### Important Note for TestFlight

For local testing, a LAN IP or `localhost` can work.

For TestFlight or any public release, the app must use a public HTTPS endpoint, for example:

```text
https://fitdiary-vision-proxy.onrender.com/estimate-fuel
```

TestFlight builds cannot reach a private local address like:

```text
http://192.168.x.x:8787
```

## Running the App Locally

### Install Dependencies

```powershell
npm install --legacy-peer-deps
```

### Start Expo

```powershell
npx expo start
```

### Start Expo With Environment Variables

```powershell
npm run start:env
```

### Start the Vision Proxy

```powershell
npm run vision:server:env
```

### Web Preview

```powershell
npx expo start --web
```

## Available Scripts

```powershell
npm start
npm run start:env
npm run android
npm run ios
npm run web
npm run vision:server
npm run vision:server:env
```

## Deploying the Vision Proxy

This repo includes Render deployment scaffolding:

- [`Dockerfile`](./Dockerfile)
- [`render.yaml`](./render.yaml)

### Recommended Render Flow

1. Create a new Web Service in Render from this repository.
2. Let Render detect [`render.yaml`](./render.yaml).
3. Add the secret environment variable:

```text
HF_TOKEN=hf_your_token_here
```

4. Deploy the service.
5. Copy the public URL.
6. Set `EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT` to:

```text
https://your-render-url/estimate-fuel
```

7. Rebuild the mobile app so the public endpoint is baked into the build.

## iOS / TestFlight

The repo is configured for Expo EAS builds and App Store Connect submission.

### Build

```powershell
npx eas build -p ios --profile production
```

### Submit

```powershell
npx eas submit -p ios --profile production
```

### App Identifiers

- iOS bundle identifier: `fitdiary.fintery`
- Android package: `fitdiary.fintery`
- EAS project ID: `d72b4a36-38da-4164-81d3-25cbcd0c1ce5`

## Validation Commands

Type check:

```powershell
npm exec --package typescript -- tsc --noEmit --pretty false
```

Resolve Expo config:

```powershell
npx expo config --type public
```

Run Expo doctor:

```powershell
npx expo-doctor
```

## Known Limitations

- Authentication is local-only today.
- The leaderboard is local friend-circle state, not real-time multi-user sync.
- Reminders are local-device notifications only.
- Hydration rollover depends on app open/reload behavior.
- Meal-photo AI estimation depends on a configured backend endpoint.
- Nutrition estimates are convenience estimates, not medical measurements.
- Strava integration is not built yet.

## Roadmap

### Next

- Deploy the meal-photo proxy publicly
- Rebuild and ship a fresh TestFlight version
- Replace local-only leaderboard data with true synced friend competition
- Add better search and filters for workout and meal history

### Later

- Backend auth and user accounts
- Redeemable friend invites
- Synced goals and competitions
- Strava integration
- Analytics, charts, and longer-term progress views

## Contributor Notes

- Keep [`App.tsx`](./App.tsx) as the top-level coordinator, not a monolith for every feature.
- Put reusable UI into `src/components`.
- Put screen-level layout into `src/screens`.
- Put provider or external-service integrations into `src/services`.
- Put shared helpers and persistence logic into `src/utils`.
- Put shared app types into [`src/types/app.ts`](./src/types/app.ts).

## Status

FitDiary is currently in a strong prototype-to-product transition state:

- polished mobile UI
- stable local logging flows
- TestFlight-ready Expo setup
- backend-ready AI meal-photo architecture
- social foundations already visible in the product

The next major production milestone is turning the local social and AI layers into fully deployed services.
