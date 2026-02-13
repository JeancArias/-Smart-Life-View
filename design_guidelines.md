# Smart Life Camera Viewer - Design Guidelines

## Brand Identity

**Purpose**: Multi-camera monitoring app for Smart Life users who need to view multiple security cameras simultaneously on mobile and Google TV.

**Aesthetic Direction**: Professional/technical - Clean, high-contrast interface optimized for quick glancing and continuous monitoring. Dark-themed to reduce eye strain during extended viewing. Minimal UI chrome to maximize camera viewport space.

**Memorable Element**: Smart grid system that auto-arranges cameras with smooth transitions and status indicators that are visible at a glance.

## Authentication

**Required**: Users must authenticate with Smart Life credentials to access their cameras.

**Implementation**:
- Login screen with Smart Life branding
- Username/password fields (Smart Life doesn't support SSO)
- "Remember me" toggle
- Profile screen with:
  - User avatar (generated preset)
  - Display name
  - Connected devices count
  - Settings access
  - Log out button (with confirmation)
  - Delete account (Settings > Account > Delete with double confirmation)

## Navigation Architecture

**Root Navigation**: Tab Navigation (3 tabs)
- **Cameras** (Home) - Grid view of all cameras
- **Add Camera** (Center, primary action) - Discover and connect devices
- **Profile** - User settings and account management

## Screen Specifications

### 1. Login Screen (Stack-only)
- **Layout**: Centered form, no header
- **Safe Area**: top: insets.top + Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Components**: Smart Life logo, username field, password field, login button, error messages
- **Empty State**: Connection error illustration (connection-error.png)

### 2. Cameras Screen (Tab 1 - Home)
- **Layout**: 
  - Transparent header with app title left, refresh button right
  - Scrollable grid (2 columns mobile, 4 columns TV)
  - Safe area: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components**: 
  - Camera cards with live feed preview, camera name overlay, status dot (green/red)
  - Tap card to fullscreen
  - Pull to refresh
- **Empty State**: Illustration showing "No cameras connected" (empty-cameras.png)

### 3. Camera Fullscreen (Modal)
- **Layout**: Full viewport camera feed, minimal controls overlay
- **Safe Area**: All edges insets + Spacing.md
- **Components**: Close button (top-left), camera name (top-center), PTZ controls (bottom if supported), screenshot button (bottom-right)

### 4. Add Camera Screen (Tab 2 - Center)
- **Layout**: 
  - Default header "Add Camera" with cancel left
  - Scrollable list of discovered devices
  - Safe area: top: Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components**: 
  - Search indicator during discovery
  - Device list items (camera icon, name, IP, "Add" button)
  - Manual entry button at bottom
- **Empty State**: Illustration "Searching for devices..." (searching-devices.png)

### 5. Profile Screen (Tab 3)
- **Layout**: 
  - Transparent header "Profile"
  - Scrollable content
  - Safe area: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components**: 
  - Avatar at top (tap to change)
  - Display name
  - Connected devices count
  - Settings list: Grid Layout, Video Quality, Notifications, Account, About
  - Log Out button (red accent)

### 6. Settings Screen (Stack)
- **Layout**: 
  - Default header "Settings" with back button
  - Scrollable form
  - Safe area: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Components**: Toggle switches, selection lists, nested navigation

## Color Palette

**Primary**: #00D9FF (Cyan - tech/monitoring aesthetic, high visibility)
**Background**: #0A0E14 (Very dark blue-black)
**Surface**: #1A1F2E (Elevated dark surface)
**Surface Variant**: #252B3A (Cards, inputs)
**Text Primary**: #FFFFFF
**Text Secondary**: #8B93A8
**Success**: #00FF88 (Camera online)
**Error**: #FF3366 (Camera offline)
**Border**: #2D3342

## Typography

**Font**: System default (SF Pro iOS, Roboto Android) - legibility critical for monitoring
**Scale**:
- Title: 28px, Bold
- Headline: 20px, Semibold
- Body: 16px, Regular
- Caption: 14px, Regular (camera names, timestamps)
- Small: 12px, Medium (status labels)

## Visual Design

- Camera cards: rounded corners (12px), subtle border (Border color), no shadow
- Status dots: 8px diameter, positioned top-right of camera cards
- Floating fullscreen controls: white with 30% black background, shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Touchable feedback: Primary color overlay at 20% opacity
- All icons: Feather icon set, 24px standard size

## Assets to Generate

1. **icon.png** - Cyan grid of 4 camera dots on dark background - App icon on device home screen

2. **splash-icon.png** - Same as app icon - Splash screen during launch

3. **empty-cameras.png** - Minimalist illustration of empty camera grid with dashed outlines - Cameras screen when no devices connected

4. **connection-error.png** - Simple broken connection symbol - Login screen when Smart Life connection fails

5. **searching-devices.png** - Radar/scanning waves illustration - Add Camera screen during device discovery

6. **avatar-preset.png** - Simple circular gradient avatar - Default user profile picture

7. **camera-placeholder.png** - Dark rectangle with camera icon - Camera cards while feed loads

**Style for all illustrations**: Minimal line art in Primary color (#00D9FF) on transparent background, 2px stroke weight, 256x256px