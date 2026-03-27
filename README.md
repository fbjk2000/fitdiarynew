# FitDiary

FitDiary is an Expo + React Native fitness tracker focused on fast daily logging for workouts, meals, hydration, streak momentum, goals, reminders, and a growing social layer.

## Current Product Surface

- Local account sign-in for device-based profiles
- Workout logging with create, edit, and delete flows
- Meal logging with create, edit, delete, and nutrition suggestion flows
- Meal photo capture/upload with an AI-ready estimate pipeline
- Hydration tracking with a daily progress bar
- Streak calculation derived from workout history
- Goals and visible progress tracking
- Daily reminders for workouts, fuel, and hydration
- Profile photos and leaderboard avatars
- Friend-circle invites and a local social leaderboard

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81.5
- TypeScript
- AsyncStorage for local persistence
- `expo-image-picker` for profile and meal photos
- `expo-notifications` for local reminder scheduling

## Project Structure

```text
FitDiary/
|-- App.tsx
|-- app.json
|-- assets/
|-- server/
|   `-- vision-proxy.mjs
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
|-- package.json
`-- tsconfig.json
```

## Features

### Authentication

Authentication is local-only today and acts as a lightweight device profile rather than a backend identity system.

### Dashboard

The dashboard surfaces:

- today’s workout calories
- today’s meal calories
- hydration progress
- streak status
- quick actions
- workout shortcuts
- goal progress
- leaderboard preview

### Workouts

Users can:

- create workouts
- edit workouts
- delete workouts with confirmation

Workout streaks are calculated from saved workout dates rather than a fragile “last workout” shortcut.

### Meals

Users can:

- create meals
- edit meals
- delete meals with confirmation
- get heuristic nutrition suggestions for common foods
- attach a meal photo
- run an AI-ready photo estimate flow when a backend endpoint is configured

### Hydration

Hydration is tracked locally per user profile and resets daily when reloaded on a new day.

### Goals

Users can choose a primary goal such as:

- lose weight
- improve cardio fitness
- recover
- build strength

FitDiary shows local progress toward that goal based on current activity patterns.

### Reminders

Users can set local daily reminders for:

- workouts
- fuel intake
- hydration

### Leaderboard

The leaderboard now supports:

- friend-circle invites
- active and pending friend states
- profile avatar display
- current-user highlighting

It is still not a true backend-synced competition layer yet.

## Local Persistence

FitDiary uses AsyncStorage and scopes data by user email for:

- workouts
- meals
- water intake
- water day key
- friend-circle members
- goals and reminder preferences

This prevents one local profile from inheriting another profile’s saved activity on the same device.

## Fuel Photo MVP

FitDiary now includes a meal-photo flow in the mobile app.

What it does today:

- lets the user take a photo or choose one from the library
- previews the image in the meal modal
- can call a backend endpoint to estimate meal label, calories, protein, carbs, and fat
- stores the image URI and estimate source alongside the logged meal

### Why there is a backend proxy

The app intentionally does not call a hosted vision model directly with a secret token from the mobile client.

Instead, the mobile app expects a public endpoint via:

```text
EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT
```

and the backend proxy holds the real provider token.

### Included proxy

This repo includes a minimal Node proxy:

[`server/vision-proxy.mjs`](./server/vision-proxy.mjs)

Start it with:

```powershell
npm run vision:server
```

### Deploying the proxy for TestFlight

TestFlight builds cannot reach a local LAN server on your computer, so the photo estimator needs a public backend URL before you ship this feature to testers.

This repo includes deployment scaffolding for Render:

- [`Dockerfile`](./Dockerfile)
- [`render.yaml`](./render.yaml)

Recommended Render setup:

1. Create a new Web Service from this repo.
2. Render will detect [`render.yaml`](./render.yaml).
3. In Render, set the secret environment variable:

```text
HF_TOKEN=hf_your_token_here
```

4. After deployment, copy the public URL, for example:

```text
https://fitdiary-vision-proxy.onrender.com/estimate-fuel
```

5. Set that value as the app endpoint for builds:

```text
EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT=https://fitdiary-vision-proxy.onrender.com/estimate-fuel
```

6. Rebuild the iOS app with EAS so TestFlight picks up the public endpoint.

### Required environment variables

Copy [`.env.example`](./.env.example) and provide:

```text
EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT=http://localhost:8787/estimate-fuel
HF_TOKEN=hf_your_token_here
FITDIARY_VISION_MODEL=Qwen/Qwen2.5-VL-7B-Instruct
FITDIARY_VISION_BASE_URL=https://router.huggingface.co/v1/chat/completions
```

### Expected endpoint contract

The mobile app sends:

- `imageBase64`
- `mimeType`
- `task`
- `units`

The proxy returns:

- `label`
- `calories`
- `protein`
- `carbs`
- `fat`
- optional `confidence`
- optional `notes`

### Open-model recommendation

The current proxy is designed for an open vision model route and is a good fit for a Qwen2.5-VL style backend.

Relevant source:

- Hugging Face Inference Providers chat completion docs: https://huggingface.co/docs/inference-providers/tasks/chat-completion

### Production note

For local testing, a LAN IP is fine.

For TestFlight or any public distribution, `EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT` must point to a deployed HTTPS endpoint, not `localhost` or a private IP like `192.168.x.x`.

### Important local testing note

If you test on a real phone, `localhost` points to the phone, not your computer.

For device testing, use either:

- your computer’s LAN IP instead of `localhost`
- a tunnel / reverse proxy
- or a deployed backend endpoint

## Getting Started

### Install dependencies

```powershell
npm install --legacy-peer-deps
```

### Start Expo

```powershell
npx expo start
```

### Start Expo on a specific port

```powershell
npx expo start --port 8084
```

### Web preview

```powershell
npx expo start --port 8084
```

Then press `w` in the Expo terminal, or open:

```text
http://localhost:8084
```

## Available Scripts

```powershell
npm start
npm run android
npm run ios
npm run web
npm run vision:server
```

## TestFlight Flow

This repository includes [`eas.json`](./eas.json) for Expo Application Services builds.

Typical iOS flow:

1. Log in to Expo:

```powershell
npx eas login
```

2. Build the iOS production binary:

```powershell
npx eas build -p ios --profile production
```

3. Submit the build to App Store Connect / TestFlight:

```powershell
npx eas submit -p ios --profile production
```

## Validation

Type-check the project with:

```powershell
npm exec --package typescript -- tsc --noEmit --pretty false
```

Resolve Expo config with:

```powershell
npx expo config --type public
```

## Known Limitations

- authentication is local-only
- the leaderboard is local friend-circle state, not real-time multi-user sync
- hydration rollover is based on reload/open behavior, not background timers
- reminder scheduling is local-device only
- meal-photo AI estimation requires a configured backend endpoint
- photo-based nutrition is an estimate, not a medical-grade measurement
- Android emulator support depends on a working Android SDK and `adb`

## Roadmap

### Near term

- connect the friend leaderboard to a real backend-backed model
- add workout and meal search/filtering
- improve validation and inline form feedback
- connect the meal-photo proxy to a deployed vision endpoint

### Medium term

- introduce a real backend auth/data model
- add history views and calendar-based tracking
- support goals and progress trends over time
- add Strava sync
- add test coverage for logging and persistence flows

### Longer term

- richer analytics and charts
- wearables or health-platform integrations
- fully synced social competitions

## Notes For Contributors

- `App.tsx` should remain a coordinator, not a catch-all feature file
- shared types belong in [`src/types/app.ts`](./src/types/app.ts)
- reusable UI belongs in `src/components`
- screen-level UI belongs in `src/screens`
- provider bridges belong in `src/services`
- persistence helpers and shared logic belong in `src/utils`

## Current Status

FitDiary is in a solid local-development state:

- Expo config resolves successfully
- TypeScript passes
- the app can be previewed locally with Expo
- the TestFlight path is already in place

The next major step for production readiness is wiring the social and meal-photo layers to real backend services.
