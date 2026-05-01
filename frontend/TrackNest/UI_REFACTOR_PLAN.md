# UI Refactoring Plan — TrackNest Mobile

> Reference designs: `designs/` folder  
> Base branch: `vinh`

---

## Overview

Six screens are being redesigned based on new mockups. The changes span navigation structure, individual screen layouts, new shared components, and one entirely new screen (Family Chat).

### Files at a Glance

| Action | File |
|--------|------|
| **Create** | `components/AppHeader.tsx` |
| **Create** | `app/(app)/(tabs)/dashboard.tsx` |
| **Create** | `app/(app)/family-chat.tsx` |
| **Modify** | `app/(app)/(tabs)/_layout.tsx` |
| **Modify** | `app/(app)/(tabs)/map.tsx` |
| **Modify** | `components/MapHeader.tsx` |
| **Modify** | `components/BottomSheets/FollowerInfoSheet.tsx` |
| **Modify** | `app/(app)/sos.tsx` |
| **Modify** | `app/(app)/(tabs)/reports.tsx` |
| **Modify** | `app/(app)/(tabs)/settings.tsx` |

### Execution Order

```
Task 8  →  Task 2  →  Task 1    (Dashboard tab: header → screen → navigation)
Task 4                           (SOS: self-contained)
Task 5                           (Reports: self-contained)
Task 6                           (Settings: depends on Task 8)
Task 7  →  Task 3                (Family Chat screen → wire into Map)
```

---

## Task 1 — Tab Navigation Refactor

**File:** `app/(app)/(tabs)/_layout.tsx`  
**Design ref:** All screen designs (tab bar visible at bottom)

### What Changes
The designs show a **4-tab layout**: `Map | Reports | Dashboard | Settings`.  
Currently there are only 3 tabs (Map, Reports, Settings). A dedicated **Dashboard** tab must be inserted between Reports and Settings.

### Steps
- [ ] Add a `dashboard` tab entry pointing to the new `dashboard.tsx` screen
- [ ] Use `grid-outline` / `grid` (focused) icon for Dashboard
- [ ] Update `reports` tab icon to `bar-chart-outline` / `bar-chart` (focused)
- [ ] Verify tab order matches design: Map → Reports → Dashboard → Settings

---

## Task 2 — New Dashboard Tab Screen

**New file:** `app/(app)/(tabs)/dashboard.tsx`  
**Reference:** existing `app/(app)/crime-dashboard.tsx`  
**Design ref:** `designs/Crime_Dashboard.png`

### What Changes

| Current (`crime-dashboard.tsx`) | New Design |
|---------------------------------|------------|
| Back-button pushed screen | Standalone tab with `AppHeader` |
| Horizontal trend bars | **Vertical bar chart** (MON–SUN, 7 bars) |
| No severity visualization | **Donut / ring chart** for severity breakdown |
| 4 separate stat cards in a row | **2×2 stat grid** (Total / Active / Investigating / Resolved) |
| No activity feed | **Recent Activity** list with icon, tags, description |

### Steps
- [ ] Create `app/(app)/(tabs)/dashboard.tsx` using the shared `AppHeader` (Task 8)
- [ ] Build a `2×2 StatGrid` — teal numbers, grey label, white card, subtle border
- [ ] Build `VerticalBarChart` — 7 day bars using `View` height proportional to max value; highlight peak bar in teal, others in light grey; `MON`–`SUN` labels below
- [ ] Build `DonutChart` — outer ring with three arc segments (Critical / High / Medium-Low); center shows active case count and label; legend rows below with colored dots and percentages
- [ ] Build `RecentActivityItem` — leading icon in a circle, title + timestamp, description text, severity chip + status chip as tags
- [ ] Reuse `getDashboardSummary()` data-fetching from `criminalReportsService`
- [ ] Keep `app/(app)/crime-dashboard.tsx` untouched (backwards compatible)

---

## Task 3 — Home / Map Screen Redesign

**Files:**
- `app/(app)/(tabs)/map.tsx`
- `components/BottomSheets/FollowerInfoSheet.tsx`
- `components/MapHeader.tsx`

**Design ref:** `designs/Home_Screen.png`

### What Changes
The current follower info is shown in a `BottomSheetModal`. The new design replaces it with an **inline floating card** that sits above the tab bar when a follower is selected. The Family Circle selector moves to a centered pill in the header.

### Bottom Info Card (new layout)
```
┌─────────────────────────────────────────┐
│  [Avatar]  Sarah          [Chat] [Call] │
│            ● Active Now                 │
├─────────────────────────────────────────┤
│  📍 Current Location                    │
│     123 Park Ave, NY              >     │
├───────────────────┬─────────────────────┤
│  ⚡ CHARGING      │  🚶 WALKING         │
│  85%              │  5 mph        [SOS] │
│  Battery Level    │  Current Speed      │
└───────────────────┴─────────────────────┘
```

### Steps
- [ ] In `map.tsx`, replace `FollowerInfoSheet` bottom sheet with a `position: absolute` floating card (bottom, above tab bar) that animates in/out using `Animated.timing`
- [ ] Redesign `MapHeader.tsx` — Family Circle selector becomes a centered white pill button with teal text and a dropdown chevron
- [ ] Add `onChatPress` handler on the card that navigates to `/(app)/family-chat`
- [ ] Add `onCallPress` handler (stub with `Linking.openURL('tel:...')` or `Alert` placeholder)
- [ ] Show battery percentage and speed from follower data; add `batteryLevel` and `activityMode` fields to the `Follower` type if not present
- [ ] SOS button in the card routes to `/sos`
- [ ] Keep existing `BottomSheetModal` sheets (map type, family circle list) unchanged

---

## Task 4 — Emergency SOS Screen Redesign

**File:** `app/(app)/sos.tsx`  
**Design ref:** `designs/Emergency_Screen.png`

### What Changes

| Current | New Design |
|---------|------------|
| `Ionicons "warning"` size 80 | Medical `*` text in a small semi-transparent circle |
| `"EMERGENCY SOS"` large title | `"Emergency SOS"` bold white title (normal casing) |
| Large countdown + `"seconds"` label below | Countdown number inside a **frosted glass circle** (~200×200, `rgba(255,255,255,0.15)`) |
| Instruction text with `{countdown}` variable | Static: `"Notifying your emergency contacts and local authorities in..."` |
| Swipe pill + separate "Send Emergency Now" button | **Only** the swipe pill — no extra button |
| No label above swipe | `ACTION REQUIRED` uppercase letter-spaced label |
| `>>` is a close icon | Pill has `>>` chevrons as drag handle; `"Swipe to Cancel"` text centered in track |

### Steps
- [ ] Replace warning icon with `*` character in a `View` (rounded, semi-transparent white background)
- [ ] Restyle title to `"Emergency SOS"` — bold, white, no letter spacing
- [ ] Redesign countdown container: fixed `200×200` circle, `borderRadius: 100`, `backgroundColor: rgba(255,255,255,0.15)`, countdown number centered inside
- [ ] Remove the separate `emergencyButton` ("Send Emergency Now") entirely
- [ ] Add `ACTION REQUIRED` label (`fontSize: 11`, uppercase, letter-spacing, muted white) above the swipe pill
- [ ] Redesign swipe pill: larger pill, `>>` text or double-chevron icon as the drag thumb, `"Swipe to Cancel"` text in the track
- [ ] Keep all existing logic: countdown timer, `PanResponder`, `triggerEmergency`, `BackHandler` block

---

## Task 5 — Reports Screen Card Redesign

**File:** `app/(app)/(tabs)/reports.tsx`  
**Design ref:** `designs/Reports_Screen.png`

### What Changes

| Current | New Design |
|---------|------------|
| Text-only card | Card with **image / illustration area** (top ~160px) |
| Severity chip top-right | Severity badge (`● HIGH`) **overlaid top-left** of image area |
| Emoji address + emoji date | `📍` icon + address, `🕐` icon + date in secondary style |
| Dashboard / analysis icon buttons in header | Removed — Dashboard is now a tab |

### Steps
- [ ] Redesign `ReportCard`: add a top `View` (height 160, `backgroundColor: #f0f4f8`) as the image placeholder; overlay the severity badge with `position: absolute, top: 8, left: 8`
- [ ] Redesign `MissingPersonCard` with the same image area pattern
- [ ] Remove the `headerActions` row (stats-chart and bar-chart icon buttons) from the header
- [ ] Update severity chip style: pill with a leading colored dot, no background fill — just border
- [ ] Keep `FlatList`, pagination, pull-to-refresh, and FAB logic unchanged

---

## Task 6 — Settings Screen Redesign

**File:** `app/(app)/(tabs)/settings.tsx`  
**Design ref:** `designs/Settings_Screen.png`

### What Changes

| Current | New Design |
|---------|------------|
| Small centered title | `AppHeader` (Task 8) + large left-aligned `"Settings"` title |
| No subtitle | `"Manage your sanctuary preferences"` subtitle |
| 5+ dense sections | **3 sections**: General, Maps & Safety, Privacy |
| Sign Out buried in scroll | Large full-width `"Sign Out"` button at bottom |
| Mixed icon backgrounds | Consistent **teal circular** icon backgrounds |

### Section Mapping

| New Section | Items |
|-------------|-------|
| **General** | Manage Family Circles → `/family-circles/new`, Notifications → `openNotifModal` |
| **Maps & Safety** | Location History → `/location-history`, Safe Zones → `/safe-zones`, Voice SOS Command (inline `Switch`) |
| **Privacy** | Data Permissions → `showPrivacyModal` |

> Developer, sync, support, and privacy-toggle sections remain in code but are only rendered when `devMode` is active.

### Steps
- [ ] Replace header row with shared `AppHeader` (Task 8)
- [ ] Add `"Settings"` large title (`fontSize: 28, fontWeight: "700"`) and subtitle below app header
- [ ] Reduce rendered sections to exactly 3 (General, Maps & Safety, Privacy) for non-dev mode
- [ ] Wrap remaining sections in `{devMode && ...}` guard
- [ ] Redesign setting row icon: `width: 48, height: 48, borderRadius: 24`, `backgroundColor: rgba(116,190,203,0.15)`, teal icon
- [ ] Move Sign Out to a standalone wide `Pressable` button (`borderRadius: 14`, light grey background, sign-out icon + `"Sign Out"` label) below all sections
- [ ] Remove footer version text (or move it to developer section)

---

## Task 7 — New Family Chat Screen

**New file:** `app/(app)/family-chat.tsx`  
**Design ref:** `designs/Family_Chat_Screen.png`

### What it is
A new **push navigation screen** opened from the chat button on the Map follower info card. This screen does not exist in the current codebase.

### Layout
```
┌─────────────────────────────────────────┐
│  [👥]     TrackNest            [🔔]     │  ← AppHeader
├─────────────────────────────────────────┤
│  Family Circle                  [😀😀+3] │
│  ● 5 Members · Online                   │
├─────────────────────────────────────────┤
│           Today, 9:41 AM                │  ← Timestamp divider
│                                         │
│  [Avatar]  Sarah                        │
│  ┌──────────────────────────────┐       │
│  │ Has anyone seen Max's leash? │       │  ← Inbound bubble (grey)
│  └──────────────────────────────┘       │
│  9:42 AM                                │
│                                         │
│       ┌──────────────────────────────┐  │
│       │ I left it in the car! Sorry  │  │  ← Outbound bubble (teal)
│       └──────────────────────────────┘  │
│                         9:45 AM · Read  │
│                                         │
│  [Avatar]  David                        │
│  ┌──────────────────────────────┐       │
│  │ [● LIVE]  [Map image]        │       │  ← Live location card
│  │  Central Park Dog Run   [▶]  │       │
│  │  Updated just now            │       │
│  └──────────────────────────────┘       │
│  10:15 AM                               │
├─────────────────────────────────────────┤
│  [📎]  Message Family Circle...   [▶]   │  ← Input bar
└─────────────────────────────────────────┘
```

### Steps
- [ ] Create `app/(app)/family-chat.tsx` with `SafeAreaView` + `KeyboardAvoidingView`
- [ ] Build `ChatBubble` component: `variant: 'inbound' | 'outbound'`, sender name (inbound only), message text, timestamp, read receipt (outbound only)
- [ ] Build `TimestampDivider` component: centered grey label row
- [ ] Build `LiveLocationCard` component: map image placeholder with `● LIVE` badge, location name, navigation arrow button, "Updated just now" — static/placeholder wired to map context later
- [ ] Build `ChatInputBar` component: attachment icon, `TextInput`, teal send button
- [ ] Build header sub-row: title `"Family Circle"`, subtitle `"5 Members · Online"`, stacked avatar group with `+N` overflow chip
- [ ] Wire the chat icon in the Map follower card (Task 3) to `router.push('/(app)/family-chat')`
- [ ] No backend integration required at this stage — use static mock messages

---

## Task 8 — Shared App Header Component

**New file:** `components/AppHeader.tsx`  
**Design ref:** `designs/Crime_Dashboard.png`, `designs/Family_Chat_Screen.png`, `designs/Settings_Screen.png`

### What it is
A stateless header component shared across all tab screens. Visible in the Dashboard, Family Chat, and Settings designs.

### Layout
```
[👥 icon]        TrackNest        [🔔 icon]
```

### Props
```ts
interface AppHeaderProps {
  onFamilyPress?: () => void;
  onNotificationsPress?: () => void;
}
```

### Steps
- [ ] Create `components/AppHeader.tsx`
- [ ] Use `useSafeAreaInsets` for `paddingTop`
- [ ] Left: `Ionicons "people-outline"` in teal
- [ ] Center: `"TrackNest"` text in teal, `fontWeight: "700"`, `fontSize: 18`
- [ ] Right: `Ionicons "notifications-outline"` in teal
- [ ] Use this component in: Dashboard (Task 2), Settings (Task 6), Family Chat (Task 7)

---

## Design Tokens (Reference)

All new UI should use values from `styles/styles.ts`:

```ts
colors.primary        // #74becb  — teal, main brand color
colors.primaryDark    // darker teal
colors.primaryLight   // lighter teal
colors.danger         // red — used in SOS, severity badges
colors.warn           // amber — "Investigating" / "Medium" severity
colors.success        // green — "Resolved" status
colors.textPrimary    // main text
colors.textSecondary  // secondary/meta text
colors.textMuted      // placeholder, disabled

spacing.xs  // 6
spacing.sm  // 8
spacing.md  // 12
spacing.lg  // 16
spacing.xl  // 24

radii.sm    // 8
radii.md    // 12
radii.lg    // 18
```
