# TrackNest Mobile App - Missing Functions Implementation Plan

## Executive Summary

This plan integrates missing functions from the use case diagram into the existing TrackNest mobile application. The plan focuses on maintaining consistency with backend services, preventing type errors, and enhancing the user experience.

## Current Status Analysis

### ✅ **Already Implemented**
- **User Authentication** via Keycloak OAuth2/OIDC
- **Real-time Location Tracking** via gRPC streaming
- **Family Circle Management** with OTP-based joining
- **Emergency SOS** with voice activation and countdown
- **Push Notifications** via Firebase
- **Basic Maps Interface** with real-time family member locations
- **Location History** with time-series optimization

### ❌ **Missing Critical Functions**
Based on use case diagram analysis, the following functions need implementation:

## Implementation Plan

### **Phase 1: Emergency Operations Integration (Priority: CRITICAL)**

#### **1.1 Emergency Service Backend Integration**
- **Target**: Connect SOS to Emergency Operations Service
- **Backend Service**: `service/emergency-ops/` (port 25432)
- **Required APIs**: EmergencyRequestController, SafeZoneController

**Files to Create/Modify:**
```
frontend/TrackNest/
├── services/
│   └── emergency.ts                   # NEW - Emergency operations REST API client
├── app/(app)/
│   └── sos.tsx                        # MODIFIED - Enhanced to send real emergency requests
└── contexts/
    └── EmergencyContext.tsx           # NEW - Simplified emergency state for SOS usage
```

**Implementation Details:**
1. **Emergency Request Creation**
   - Emergency requests sent ONLY when SOS countdown times out (no manual trigger)
   - Real-time location capture at time of emergency
   - Automatic backend integration with Emergency Operations Service
   - User can cancel during 10-second countdown period

2. **Safe Zone Integration** 
   - Get nearest safe zones during emergency situations
   - Spatial queries for finding closest emergency services
   - Integration with Emergency Operations Service safe zone data

#### **1.2 Enhanced SOS Integration**
**Target**: Connect existing SOS to emergency dispatch (emergency requests sent ONLY on SOS timeout)
**Files to Modify:**
- `app/(app)/sos.tsx` - Connect to emergency service, trigger only on countdown timeout
- `contexts/EmergencyContext.tsx` - Simplified emergency state management for SOS usage only

**Emergency Request Flow:**
1. User activates SOS screen (manually or via voice)
2. 10-second countdown begins
3. User can cancel during countdown (swipe to cancel)
4. If countdown reaches 0 → Emergency request is automatically sent to backend
5. Emergency responders receive the request via Emergency Operations Service

### **Phase 2: Criminal Reports Integration (Priority: HIGH)**

#### **2.1 Criminal Reports Backend Integration**
- **Target**: Replace mock data with real Criminal Reports Service
- **Backend Service**: `service/criminal-reports/` (port 35432)
- **Required APIs**: ReportManagerController, CrimeLocatorController, MissingPersonRequestReceiverController

**Files to Create/Modify:**
```
frontend/TrackNest/
├── proto/
│   ├── criminal-reports.proto          # NEW - Criminal reports definitions
│   ├── criminal-reports_pb.d.ts       # Generated
│   ├── criminal-reports_pb.js         # Generated
│   └── CriminalReportsServiceClientPb.ts # NEW - gRPC client
├── services/
│   ├── criminalReports.ts             # NEW - Replace reports.ts
│   └── missingPersons.ts              # NEW - Missing person service
├── app/(app)/
│   ├── reports/                       # NEW - Enhanced reports screens
│   │   ├── crime-reports.tsx          # Crime report management
│   │   ├── missing-persons.tsx        # Missing person management
│   │   ├── submit-crime-report.tsx    # Submit crime report with media
│   │   ├── submit-missing-person.tsx  # Submit missing person report
│   │   └── report-details.tsx         # Report details view
│   └── (tabs)/
│       └── reports.tsx                # MODIFY - Enhanced reports tab
└── components/
    ├── CrimeReportCard.tsx            # NEW - Crime report display
    ├── MissingPersonCard.tsx          # NEW - Missing person display
    └── MediaUpload.tsx                # NEW - MinIO file upload
```

**Implementation Details:**
1. **Crime Report Management**
   - Publish/Delete Crime Report with spatial indexing
   - Generate Crime Analysis Report
   - Crime correlation with user location
   - Media upload via MinIO integration

2. **Missing Person Management**
   - Submit/Delete/Publish Missing Person Report
   - Missing person alerts with geofenced notifications
   - Guidelines document viewing
   - Advanced search capabilities

#### **2.2 MinIO Integration for Media Upload**
**Target**: File storage for reports
**Files to Create:**
- `services/mediaUpload.ts` - MinIO integration
- `utils/fileUpload.ts` - File upload utilities

### **Phase 3: Guardian & Voice Management (Priority: MEDIUM)**

#### **3.1 Guardian Management System**
**Target**: Advanced family circle management with roles

**Files to Create/Modify:**
```
frontend/TrackNest/
├── app/(app)/
│   ├── guardians/                     # NEW - Guardian management
│   │   ├── add-guardian.tsx           # Add guardian workflow
│   │   ├── guardian-list.tsx          # Guardian management
│   │   ├── guardian-permissions.tsx   # Permission management
│   │   └── voice-commands.tsx         # Voice activation management
│   └── family-circles/                # MODIFY - Enhance existing
│       ├── circle-management.tsx      # MODIFY - Add guardian roles
│       └── member-permissions.tsx     # NEW - Role-based permissions
├── services/
│   └── guardianship.ts                # NEW - Guardian management
└── contexts/
    └── GuardianContext.tsx            # NEW - Guardian state management
```

**Implementation Details:**
1. **Guardian Management**
   - Add/Remove Guardian with role assignments
   - Guardian permission management
   - Hierarchical guardian relationships

2. **Voice Activation Management**
   - Add/Remove Activation Voice commands
   - Enable/Disable Tracking via voice commands
   - Custom voice command training

#### **3.2 Enhanced Voice Controls**
**Target**: Advanced voice command system
**Files to Modify:**
- `app/(app)/(tabs)/voice-test.tsx` - Enhanced voice features
- `services/voiceRecognition.ts` - NEW - Advanced voice processing

### **Phase 4: Points of Interest & Analytics (Priority: MEDIUM)**

#### **4.1 Points of Interest Management**
**Target**: Location-based points of interest

**Files to Create:**
```
frontend/TrackNest/
├── app/(app)/
│   ├── points-of-interest/           # NEW - POI management
│   │   ├── poi-list.tsx             # POI listing
│   │   ├── add-poi.tsx              # Add POI
│   │   ├── poi-details.tsx          # POI details and editing
│   │   └── poi-categories.tsx       # POI categorization
├── services/
│   └── pointsOfInterest.ts          # NEW - POI service
└── components/
    ├── POIMarker.tsx                # NEW - Map POI markers
    └── POICard.tsx                  # NEW - POI display card
```

**Implementation Details:**
1. **POI Management**
   - View/Update/Add/Remove Points of Interest
   - POI categorization (schools, hospitals, police, etc.)
   - POI-based geofencing and notifications

#### **4.2 Enhanced Analytics & Crime Heatmap**
**Target**: Real-time crime data visualization

**Files to Create/Modify:**
```
frontend/TrackNest/
├── app/(app)/
│   ├── analytics/                    # NEW - Analytics screens
│   │   ├── crime-heatmap.tsx         # Enhanced crime visualization
│   │   ├── mobility-history.tsx      # Detailed mobility analysis
│   │   └── safety-dashboard.tsx      # Comprehensive safety metrics
├── services/
│   └── analytics.ts                 # NEW - Analytics service
└── components/
    ├── HeatmapOverlay.tsx           # NEW - Crime heatmap component
    └── MobilityChart.tsx            # NEW - Mobility visualization
```

**Implementation Details:**
1. **Crime Analytics**
   - Real-time crime heatmap with PostGIS spatial queries
   - Crime correlation with user mobility patterns
   - Predictive safety scoring based on location and time

2. **Mobility Analysis**
   - Vector-based mobility analysis from backend
   - Anomaly detection integration
   - Historical mobility patterns

### **Phase 5: User Profile & Settings (Priority: LOW)**

Since mobile app users only have the "USER" role (no ADMIN or REPORTER roles), Phase 5 focuses on user-centric features that any regular user might need.

#### **5.1 User Profile Management**
**Target**: User can manage their own profile

**Files to Create/Modify:**
```
frontend/TrackNest/
├── app/(app)/
│   └── profile.tsx                    # MODIFY - Enhanced profile screen
└── contexts/
    └── ProfileContext.tsx              # NEW - Profile state management
```

**Features:**
- View/edit user profile information
- Change password (via Keycloak)
- Account settings
- Notification preferences

#### **5.2 Privacy & Data Settings**
**Target**: User data privacy controls

**Features:**
- Location sharing preferences
- Data export options
- Account deletion request
- Privacy policy display

---

**Note**: Admin, Reporter, and Emergency Responder functions are NOT needed in the mobile app since all users have the "USER" role only.

## Implementation Priority Matrix

### **Phase 1 (Week 1-2): CRITICAL**
1. **Emergency Service Integration** - Core safety functionality
2. **Enhanced SOS Connection** - Complete emergency workflow
3. **Safe Zone Management** - Geofenced safety areas

### **Phase 2 (Week 3-4): HIGH**
1. **Criminal Reports Integration** - Real crime data
2. **Missing Person Management** - Complete reporting workflow
3. **MinIO Media Upload** - File storage integration

### **Phase 3 (Week 5-6): MEDIUM**
1. **Guardian Management** - Advanced family management
2. **Enhanced Voice Controls** - Advanced voice features
3. **Role-based Permissions** - User role management

### **Phase 4 (Week 7-8): MEDIUM**
1. **Points of Interest** - Location-based features
2. **Enhanced Analytics** - Crime correlation and mobility
3. **Predictive Safety** - ML-based risk assessment

### **Phase 5 (Week 9-10): LOW**
1. **Reporter Interface** - Role-specific features
2. **Admin Functions** - System administration
3. **Advanced Monitoring** - System health dashboards

## Technical Specifications

### **Backend Service Integration Requirements**

#### **Emergency Operations Service API**
```typescript
// Required endpoints to integrate
interface EmergencyService {
  // Emergency Request Management
  submitEmergencyRequest(location: Location, type: EmergencyType): Promise<EmergencyRequest>
  updateEmergencyStatus(requestId: string, status: EmergencyStatus): Promise<void>
  getEmergencyHistory(): Promise<EmergencyRequest[]>
  
  // Safe Zone Management  
  addSafeZone(zone: SafeZone): Promise<void>
  removeSafeZone(zoneId: string): Promise<void>
  findNearestSafeZones(location: Location): Promise<SafeZone[]>
  
  // Emergency Responder Integration
  dispatchResponder(requestId: string): Promise<ResponderAssignment>
  getResponderStatus(assignmentId: string): Promise<ResponderStatus>
}
```

#### **Criminal Reports Service API**
```typescript
// Required endpoints to integrate
interface CriminalReportsService {
  // Crime Report Management
  submitCrimeReport(report: CrimeReport, media?: File[]): Promise<string>
  deleteCrimeReport(reportId: string): Promise<void>
  getCrimeReports(filters: CrimeFilters): Promise<CrimeReport[]>
  generateCrimeAnalysis(area: BoundingBox): Promise<CrimeAnalysis>
  
  // Missing Person Management
  submitMissingPersonReport(report: MissingPersonReport): Promise<string>
  updateMissingPersonStatus(reportId: string, status: MissingPersonStatus): Promise<void>
  getMissingPersonReports(): Promise<MissingPersonReport[]>
  
  // Guidelines and Documentation
  getGuidelinesDocument(): Promise<Blob>
  getReportTemplates(): Promise<ReportTemplate[]>
}
```

### **Type Safety Requirements**

#### **Enhanced Type Definitions**
```typescript
// Emergency Types
interface EmergencyRequest {
  id: string
  userId: string
  location: Location
  type: EmergencyType
  status: EmergencyStatus
  timestamp: Date
  responderId?: string
  description?: string
}

// Crime Report Types
interface CrimeReport {
  id: string
  reporterId: string
  crimeType: CrimeType
  location: Location
  timestamp: Date
  description: string
  media: MediaFile[]
  status: ReportStatus
}

// Missing Person Types
interface MissingPersonReport {
  id: string
  reporterId: string
  missingPerson: PersonDetails
  lastSeenLocation: Location
  lastSeenTime: Date
  description: string
  media: MediaFile[]
  status: MissingPersonStatus
}
```

### **State Management Requirements**

#### **Enhanced Context Providers**
```typescript
// Emergency Context
interface EmergencyContextValue {
  activeEmergency: EmergencyRequest | null
  emergencyHistory: EmergencyRequest[]
  safeZones: SafeZone[]
  submitEmergencyRequest: (type: EmergencyType) => Promise<void>
  cancelEmergencyRequest: (requestId: string) => Promise<void>
  updateEmergencyLocation: (requestId: string, location: Location) => Promise<void>
}

// Reports Context
interface ReportsContextValue {
  crimeReports: CrimeReport[]
  missingPersonReports: MissingPersonReport[]
  submitCrimeReport: (report: CrimeReportInput) => Promise<void>
  submitMissingPersonReport: (report: MissingPersonReportInput) => Promise<void>
  uploadMedia: (files: File[]) => Promise<MediaFile[]>
}
```

## Quality Assurance Requirements

### **Backend Consistency Checks**
1. **API Endpoint Validation** - Ensure all gRPC endpoints match backend definitions
2. **Data Type Consistency** - Verify TypeScript types match protobuf definitions
3. **Authentication Flow** - Ensure JWT tokens are properly handled
4. **Error Handling** - Implement consistent error handling across services

### **Type Error Prevention**
1. **Strict TypeScript** - Enable strict mode for all new files
2. **Interface Validation** - Runtime type checking for API responses
3. **Null Safety** - Proper null/undefined handling
4. **Generic Type Safety** - Proper generic constraints

### **Testing Requirements**
1. **Unit Tests** - Jest tests for all new services
2. **Integration Tests** - gRPC client integration tests
3. **E2E Tests** - Critical workflow testing
4. **Type Tests** - TypeScript compilation validation

## Conclusion

This implementation plan provides a systematic approach to integrating all missing functions from the use case diagram while maintaining consistency with backend services and preventing type errors. The phased approach ensures critical safety features are implemented first, followed by enhanced functionality and administrative features.

**Expected Outcomes:**
- ✅ Complete emergency operations integration
- ✅ Real-time crime data and reporting
- ✅ Enhanced family safety management
- ✅ Advanced analytics and predictive safety
- ✅ Type-safe, maintainable codebase
- ✅ Consistent backend service integration

**Timeline**: 10 weeks for complete implementation
**Resource Requirements**: 1-2 React Native developers with TypeScript expertise
**Risk Mitigation**: Phased approach allows for early validation and course correction