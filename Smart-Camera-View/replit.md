# Smart Life View

## Overview

Smart Life View is a multi-camera monitoring application that allows users to view their Smart Life security cameras simultaneously. The app supports mobile devices (iOS/Android) and Google TV platforms. It features a dark-themed, professional interface optimized for continuous monitoring with minimal eye strain.

The application consists of:
- **React Native/Expo frontend** for cross-platform mobile, web, and TV support
- **Express.js backend** serving as an API layer and proxy for Tuya Smart Life integration
- **PostgreSQL database** with Drizzle ORM for data persistence

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54, using the new architecture
- **Navigation**: React Navigation v7 with a combination of:
  - Native stack navigator for authentication and fullscreen views
  - Bottom tab navigator for main app sections (Cameras, Profile)
- **State Management**: 
  - React Context for authentication (`AuthContext`) and camera data (`CameraContext`)
  - TanStack React Query for server state management
- **Styling**: Custom theme system with dark mode by default, using a consistent design token system (Colors, Spacing, BorderRadius, Typography)
- **Animations**: React Native Reanimated for smooth, performant animations
- **Storage**: AsyncStorage for local persistence of user preferences and credentials

### Backend Architecture
- **Framework**: Express.js v5 with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **Tuya Integration**: Custom Tuya client (`tuya-client.ts`) for Smart Life camera access
- **CORS**: Dynamic origin handling for Replit development and deployment domains

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Current Tables**: Users table with UUID primary keys
- **In-Memory Fallback**: `MemStorage` class for development without database

### Authentication Flow
- Users authenticate with Smart Life credentials via the login screen
- Credentials can be saved locally with "Remember Me" option
- Session state managed through AuthContext
- Protected routes redirect unauthenticated users to login

### Path Aliases
- `@/` maps to `./client/` for frontend imports
- `@shared/` maps to `./shared/` for shared code

## External Dependencies

### Tuya Smart Life API
- **Purpose**: Access user's Smart Life camera devices
- **Region**: Europe (`openapi.tuyaeu.com`)
- **Features**: Device discovery, camera streams, PTZ control, arming (motion/sound detection), cloud recordings
- **Configuration**: Requires `accessId` and `accessSecret` credentials
- **Device IDs**: bfc0e401239832af0favim (Entrada), bf9cde6482327891dfrqse (Atrás)

### Key Features
- **Fullscreen Camera View**: Smart Life-style UI with circular PTZ joystick (bottom-left) and action buttons (bottom-right)
- **Arming Controls**: Motion detection and sound detection toggles via Tuya commands (motion_switch, decibel_switch)
- **Cloud Recordings**: Access recording dates via Tuya cloud storage API
- **Global Audio Mute**: Client-side toggle persisted in AsyncStorage
- **Biometric Auth**: expo-local-authentication for fingerprint/Face ID (native only), toggle in Profile settings
- **HLS Streaming**: Web uses iframe with HLS streams from Tuya API

### Key npm Dependencies
- **expo**: Core framework for React Native development
- **drizzle-orm** + **pg**: Database ORM and PostgreSQL driver
- **@tanstack/react-query**: Server state management
- **react-native-reanimated**: Animation library
- **expo-haptics**: Touch feedback on mobile
- **http-proxy-middleware**: API proxying for development

### Development Environment
- **Build Scripts**: Custom build system for Expo static builds (`scripts/build.js`)
- **TypeScript**: Strict mode enabled with path aliases
- **Linting**: ESLint with Expo and Prettier configurations