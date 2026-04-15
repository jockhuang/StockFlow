# StockFlow Mobile

A mobile application built with Expo and React Native. One codebase supports both iOS and Android and connects directly to the Spring Boot backend APIs in this repository.

## Covered Modules

- Authentication: HTTP Basic via `/api/auth/me`
- Dashboard: system status, inventory summary, recent movements
- Inventory: item list, create, edit, delete, stock adjustments
- Transactions: filter by keyword, type, and supplier
- Categories: query, create, edit, delete
- Suppliers: query, create, edit, delete
- Item Supplier Relations: bind allowed purchase suppliers to items
- Purchase Orders: query, create, receive
- Sales Orders: query, create, ship
- Users: query, create, edit, delete
- Roles: query, create, edit, delete
- Resources: query, create, edit, delete

## Structure

- `App.tsx`: login flow and app navigation
- `src/api/client.ts`: backend API client
- `src/auth/AuthContext.tsx`: session restore and credential persistence
- `src/screens/*`: business screens
- `src/components/ui.tsx`: shared UI components

## Local Development

Install dependencies first:

```bash
cd mobile
npm install
```

Start Expo:

```bash
npm run start
```

Run native targets:

```bash
npm run ios
npm run android
```

## Backend URL

The mobile app cannot reuse the web app's relative API paths. The login screen includes an editable `API Base URL` field.

Common development addresses:

- iOS Simulator: `http://localhost:8080`
- Android Emulator: `http://10.0.2.2:8080`
- Physical device: use your computer's LAN IP, for example `http://192.168.1.20:8080`

The default value is configured in `app.json` under `expo.extra.apiBaseUrl`.

## Default Test Accounts

- `admin / Admin@123456`
- `operator / Operator@123456`

## Notes

- The current mobile app persists username and password using HTTP Basic to match the existing backend.
- If the backend URL is unreachable, the login screen will return the API error directly.
- This repository now contains the project code, but runtime validation still depends on your local simulator/device environment.
