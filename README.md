# FitDiary

FitDiary is an Expo + React Native fitness tracker focused on fast daily logging for workouts, meals, hydration, and streak momentum.

The current app includes:

- local account sign-in for device-based profiles
- workout logging with create, edit, and delete flows
- meal logging with create, edit, and delete flows
- hydration tracking with a daily progress bar
- streak calculation derived from workout history
- a polished dashboard and profile experience
- a placeholder leaderboard UI

## Tech Stack

- Expo SDK 51
- React 18
- React Native 0.74.5
- TypeScript
- AsyncStorage for local persistence

## Project Structure

The app has been refactored into a screen/component-based structure.

```text
FitDiary/
├─ App.tsx
├─ assets/
├─ src/
│  ├─ components/
│  │  └─ ModalShell.tsx
│  ├─ constants/
│  │  └─ appData.ts
│  ├─ screens/
│  │  ├─ AuthScreen.tsx
│  │  ├─ DashboardScreen.tsx
│  │  ├─ LogsScreen.tsx
│  │  └─ ProfileScreen.tsx
│  ├─ styles/
│  │  └─ appStyles.ts
│  ├─ theme/
│  │  └─ palette.ts
│  ├─ types/
│  │  └─ app.ts
│  └─ utils/
│     └─ appHelpers.ts
├─ app.json
├─ package.json
└─ tsconfig.json
```

## Features

### Authentication

Authentication is currently local-only and intended as a lightweight device profile rather than a backend account system.

### Dashboard

The dashboard surfaces:

- today’s workout calories
- today’s meal calories
- water progress
- streak status
- quick actions
- workout shortcuts
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

### Hydration

Hydration is tracked locally per user profile and resets daily when reloaded on a new day.

### Leaderboard

The leaderboard is currently a local/mock presentation layer. It is useful for UI direction, but it is not yet connected to a real backend or shared ranking system.

## Local Persistence

FitDiary uses AsyncStorage and scopes data by user email for:

- workouts
- meals
- water intake
- water day key

This prevents one local profile from inheriting another profile’s saved activity on the same device.

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
```

## Validation

Type-check the project with:

```powershell
npm exec --package typescript -- tsc --noEmit --pretty false
```

## Known Limitations

- authentication is local-only
- the leaderboard is mock/local, not real-time or multi-user
- hydration rollover is based on reload/open behavior, not background timers
- Android emulator support depends on a working Android SDK and `adb`

## Roadmap

### Near term

- replace the mock leaderboard with a real backend-backed model
- add workout and meal search/filtering
- improve validation and inline form feedback
- add confirmation/toast feedback for more actions

### Medium term

- introduce a real backend auth/data model
- add history views and calendar-based tracking
- support goals and progress trends over time
- add test coverage for logging and persistence flows

### Longer term

- social features and friend leaderboards
- richer analytics and charts
- wearables or health-platform integrations

## Notes For Contributors

- `App.tsx` should remain a coordinator, not a catch-all feature file
- shared types belong in [`src/types/app.ts`](./src/types/app.ts)
- reusable UI belongs in `src/components`
- screen-level UI belongs in `src/screens`
- persistence helpers and shared logic belong in `src/utils`

## Current Status

FitDiary is now in a good local-development state:

- the Expo config resolves successfully
- TypeScript passes
- the app can be previewed locally with Expo web

The remaining major step for production readiness is wiring the app to a real backend and syncing the leaderboard and user data beyond local device storage.
