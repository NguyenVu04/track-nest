# Criminal Reports Service — API Reference

Base URL: `http://localhost:38080`  
Swagger UI: `http://localhost:38080/swagger-ui.html`  
OpenAPI Docs: `http://localhost:38080/api-docs`

> **Authentication:** Spring Security basic auth is enabled (`admin` / `admin`). Some endpoints also require an `X-User-Id` header (UUID of the acting user).

---

## Crime Locator — `/crime-locator`

### `GET /crime-locator/heatmap`

Returns a paginated list of crime reports within a given radius of a coordinate. Intended for rendering a crime heatmap on the client.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `longitude` | double | yes | — | Center longitude |
| `latitude` | double | yes | — | Center latitude |
| `radius` | double | no | `5000` | Search radius in meters |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `20` | Page size |

**Response:** `PageResponse<CrimeReportResponse>`

---

### `GET /crime-locator/high-risk-check`

Checks whether a given coordinate falls inside a high-risk crime zone.

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `longitude` | double | yes | Longitude to check |
| `latitude` | double | yes | Latitude to check |

**Response:** `Boolean` — `true` if inside a high-risk zone, `false` otherwise

---

## Criminal Analyzer — `/criminal-analyzer`

### `GET /criminal-analyzer/crime-analysis`

Generates a statistical crime analysis report for a given date range.

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `startDate` | date (ISO) | yes | Start of the analysis period |
| `endDate` | date (ISO) | yes | End of the analysis period |

**Response:** `CrimeAnalysisReportResponse`

---

## Missing Person Request Receiver — `/missing-person-request-receiver`

External-facing endpoint for submitting missing person reports without requiring a session (user identity is passed explicitly as parameters).

### `POST /missing-person-request-receiver/submit`

Submits a missing person report on behalf of a user.

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | UUID | yes | ID of the user the report belongs to |
| `reporterId` | UUID | yes | ID of the person submitting the report |
| `title` | string | yes | Report title |
| `fullName` | string | yes | Full name of the missing person |
| `personalId` | string | yes | National ID or personal identifier |
| `photo` | string | no | URL or reference to a photo |
| `contactEmail` | string | no | Contact email address |
| `contactPhone` | string | yes | Contact phone number |
| `date` | date | yes | Date the person was reported missing |
| `content` | string | yes | Detailed description |

**Response:** `MissingPersonReportResponse`

---

## Report Admin — `/report-admin`

Admin-only endpoints for force-deleting any content regardless of ownership.

### `DELETE /report-admin/missing-person-reports/{reportId}`

Hard-deletes a missing person report as an admin.

**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

### `DELETE /report-admin/crime-reports/{reportId}`

Hard-deletes a crime report as an admin.

**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

### `DELETE /report-admin/guidelines/{documentId}`

Hard-deletes a guidelines document as an admin.

**Path Parameters:** `documentId` (UUID)  
**Response:** `204 No Content`

---

## Report Viewer — `/report-viewer`

Read-only, public-facing endpoints for viewing published content. No `X-User-Id` required.

### `GET /report-viewer/missing-person-reports/{reportId}`

Retrieves a single missing person report by its ID.

**Path Parameters:** `reportId` (UUID)  
**Response:** `MissingPersonReportResponse`

---

### `GET /report-viewer/missing-person-reports`

Lists missing person reports with optional public/private filter.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<MissingPersonReportResponse>`

---

### `GET /report-viewer/crime-reports/{reportId}`

Retrieves a single crime report by its ID.

**Path Parameters:** `reportId` (UUID)  
**Response:** `CrimeReportResponse`

---

### `GET /report-viewer/crime-reports`

Lists crime reports with optional public/private filter.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<CrimeReportResponse>`

---

### `GET /report-viewer/guidelines/{documentId}`

Retrieves a single guidelines document by its ID.

**Path Parameters:** `documentId` (UUID)  
**Response:** `GuidelinesDocumentResponse`

---

### `GET /report-viewer/guidelines`

Lists guidelines documents with optional public/private filter.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<GuidelinesDocumentResponse>`

---

## Report Manager — `/report-manager`

Full CRUD and workflow management endpoints. All endpoints require an `X-User-Id` header (UUID), except the admin sub-routes.

### Missing Person Reports

#### `POST /report-manager/missing-person-reports`

Creates a new missing person report for the authenticated user.

**Headers:** `X-User-Id: <UUID>`  
**Body:** `CreateMissingPersonReportRequest` (JSON)  
**Response:** `MissingPersonReportResponse`

---

#### `GET /report-manager/missing-person-reports/{reportId}`

Retrieves a specific missing person report owned by or visible to the user.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `MissingPersonReportResponse`

---

#### `PUT /report-manager/missing-person-reports/{reportId}`

Updates an existing missing person report.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Body:** `UpdateMissingPersonReportRequest` (JSON)  
**Response:** `MissingPersonReportResponse`

---

#### `DELETE /report-manager/missing-person-reports/{reportId}`

Deletes the user's own missing person report.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

#### `POST /report-manager/missing-person-reports/{reportId}/publish`

Publishes a missing person report, making it publicly visible.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `MissingPersonReportResponse`

---

#### `POST /report-manager/missing-person-reports/{reportId}/reject`

Rejects a missing person report (e.g., for moderation purposes).

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `MissingPersonReportResponse`

---

#### `GET /report-manager/missing-person-reports`

Lists missing person reports with optional filters.

**Headers:** `X-User-Id: <UUID>`

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `reporterId` | UUID | no | — | Filter by the reporter's user ID |
| `status` | string | no | — | Filter by report status |
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<MissingPersonReportResponse>`

---

#### `DELETE /report-manager/admin/missing-person-reports/{reportId}`

Admin hard-deletes a missing person report regardless of ownership.

**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

### Crime Reports

#### `POST /report-manager/crime-reports`

Creates a new crime report for the authenticated user.

**Headers:** `X-User-Id: <UUID>`  
**Body:** `CreateCrimeReportRequest` (JSON)  
**Response:** `CrimeReportResponse`

---

#### `GET /report-manager/crime-reports/{reportId}`

Retrieves a specific crime report owned by or visible to the user.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `CrimeReportResponse`

---

#### `PUT /report-manager/crime-reports/{reportId}`

Updates an existing crime report.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Body:** `UpdateCrimeReportRequest` (JSON)  
**Response:** `CrimeReportResponse`

---

#### `DELETE /report-manager/crime-reports/{reportId}`

Deletes the user's own crime report.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

#### `POST /report-manager/crime-reports/{reportId}/publish`

Publishes a crime report, making it publicly visible.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `reportId` (UUID)  
**Response:** `CrimeReportResponse`

---

#### `GET /report-manager/crime-reports`

Lists crime reports with optional filters.

**Headers:** `X-User-Id: <UUID>`

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `reporterId` | UUID | no | — | Filter by the reporter's user ID |
| `minSeverity` | int | no | — | Filter by minimum severity level |
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<CrimeReportResponse>`

---

#### `GET /report-manager/crime-reports/nearby`

Lists crime reports within a given radius of a coordinate.

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `longitude` | double | yes | — | Center longitude |
| `latitude` | double | yes | — | Center latitude |
| `radius` | double | no | `5000` | Search radius in meters |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<CrimeReportResponse>`

---

#### `DELETE /report-manager/admin/crime-reports/{reportId}`

Admin hard-deletes a crime report regardless of ownership.

**Path Parameters:** `reportId` (UUID)  
**Response:** `204 No Content`

---

### Guidelines Documents

#### `POST /report-manager/guidelines`

Creates a new guidelines document.

**Headers:** `X-User-Id: <UUID>`  
**Body:** `CreateGuidelinesDocumentRequest` (JSON)  
**Response:** `GuidelinesDocumentResponse`

---

#### `GET /report-manager/guidelines/{documentId}`

Retrieves a specific guidelines document visible to the user.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `documentId` (UUID)  
**Response:** `GuidelinesDocumentResponse`

---

#### `PUT /report-manager/guidelines/{documentId}`

Updates an existing guidelines document.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `documentId` (UUID)  
**Body:** `UpdateGuidelinesDocumentRequest` (JSON)  
**Response:** `GuidelinesDocumentResponse`

---

#### `DELETE /report-manager/guidelines/{documentId}`

Deletes the user's own guidelines document.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `documentId` (UUID)  
**Response:** `204 No Content`

---

#### `POST /report-manager/guidelines/{documentId}/publish`

Publishes a guidelines document, making it publicly visible.

**Headers:** `X-User-Id: <UUID>`  
**Path Parameters:** `documentId` (UUID)  
**Response:** `GuidelinesDocumentResponse`

---

#### `GET /report-manager/guidelines`

Lists guidelines documents with optional filters.

**Headers:** `X-User-Id: <UUID>`

**Query Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `reporterId` | UUID | no | — | Filter by the author's user ID |
| `isPublic` | boolean | no | `false` | Filter by public visibility |
| `page` | int | no | `0` | Page index |
| `size` | int | no | `10` | Page size |

**Response:** `PageResponse<GuidelinesDocumentResponse>`

---

#### `DELETE /report-manager/admin/guidelines/{documentId}`

Admin hard-deletes a guidelines document regardless of ownership.

**Path Parameters:** `documentId` (UUID)  
**Response:** `204 No Content`

---

## File — `/file`

Endpoints for managing files in MinIO object storage.

### `POST /file/upload`

Uploads a file to MinIO. Generates a unique object name (UUID-based) and returns the public URL.

**Headers:** `X-User-Id: <UUID>` (optional)  
**Content-Type:** `multipart/form-data`

**Form Parameters**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `file` | file | yes | — | The file to upload |
| `bucket` | string | no | `criminal-reports` | Target MinIO bucket |

**Response:** `FileUploadResponse` — includes `objectName`, `publicUrl`, `contentType`, `size`

---

### `DELETE /file/{bucket}/{filename}`

Deletes a file from MinIO storage.

**Headers:** `X-User-Id: <UUID>` (optional)  
**Path Parameters:** `bucket` (string), `filename` (string)  
**Response:** `204 No Content`

---

### `GET /file/{bucket}/{filename}`

Returns the public URL for a stored file.

**Path Parameters:** `bucket` (string), `filename` (string)  
**Response:** `string` — public URL of the file

---

## Data Shapes

Canonical JSON schemas for all request bodies and response objects.

### `PageResponse<T>`

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "first": true,
  "last": false
}
```

---

### `MissingPersonReportResponse`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `title` | string | |
| `fullName` | string | |
| `personalId` | string | |
| `photo` | string \| null | URL to photo |
| `contactEmail` | string \| null | |
| `contactPhone` | string | |
| `date` | string (ISO date) | e.g. `"2026-03-01"` |
| `content` | string | PDF URL or text content |
| `createdAt` | string (ISO 8601) | |
| `userId` | UUID string | ID of the user the report belongs to |
| `reporterId` | UUID string | ID of the reporter who submitted it |
| `statusName` | `"PENDING"` \| `"REJECTED"` \| `"PUBLISHED"` | |

```json
{
  "id": "aa111111-1111-1111-1111-111111111111",
  "title": "Missing Teenager",
  "fullName": "Nguyen Van A",
  "personalId": "ID123456",
  "photo": "https://cdn.example.com/photos/a.jpg",
  "contactEmail": "contact@example.com",
  "contactPhone": "0901000001",
  "date": "2026-03-01",
  "content": "https://cdn.example.com/files/missing-person-reports/report.pdf",
  "createdAt": "2026-03-01T10:00:00+07:00",
  "userId": "uuid",
  "reporterId": "uuid",
  "statusName": "PENDING"
}
```

---

### `CreateMissingPersonReportRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `fullName` | string | yes | |
| `personalId` | string | yes | |
| `photo` | string | no | URL |
| `contactEmail` | string | no | |
| `contactPhone` | string | yes | |
| `date` | string (ISO date) | yes | |
| `content` | string | yes | |

---

### `UpdateMissingPersonReportRequest`

All fields optional. Same fields as `CreateMissingPersonReportRequest`.

---

### `CrimeReportResponse`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `title` | string | |
| `content` | string | PDF URL or text |
| `date` | string (ISO date) | |
| `severity` | integer (1–5) | |
| `numberOfVictims` | integer (≥ 0) | |
| `numberOfOffenders` | integer (≥ 0) | |
| `arrested` | boolean | |
| `longitude` | double | |
| `latitude` | double | |
| `createdAt` | string (ISO 8601) | |
| `updatedAt` | string (ISO 8601) | |
| `reporterId` | UUID string | |
| `isPublic` | boolean | |

```json
{
  "id": "cc111111-1111-1111-1111-111111111111",
  "title": "Street Robbery",
  "content": "https://cdn.example.com/files/crime-reports/robbery.pdf",
  "date": "2026-03-01",
  "severity": 3,
  "numberOfVictims": 1,
  "numberOfOffenders": 2,
  "arrested": false,
  "longitude": 106.7009,
  "latitude": 10.7769,
  "createdAt": "2026-03-01T09:00:00+07:00",
  "updatedAt": "2026-03-01T09:00:00+07:00",
  "reporterId": "uuid",
  "isPublic": true
}
```

---

### `CreateCrimeReportRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `content` | string | yes | |
| `date` | string (ISO date) | yes | |
| `severity` | integer (1–5) | yes | |
| `numberOfVictims` | integer (≥ 0) | yes | |
| `numberOfOffenders` | integer (≥ 0) | yes | |
| `arrested` | boolean | yes | |
| `longitude` | double | yes | |
| `latitude` | double | yes | |

---

### `UpdateCrimeReportRequest`

All fields optional. Same fields as `CreateCrimeReportRequest`.

---

### `GuidelinesDocumentResponse`

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID string | |
| `title` | string | |
| `abstractText` | string | Maps from DB column `abstract` (Java keyword avoidance) |
| `content` | string | PDF URL or text |
| `createdAt` | string (ISO 8601) | |
| `reporterId` | UUID string | |
| `isPublic` | boolean | |

```json
{
  "id": "bb111111-1111-1111-1111-111111111111",
  "title": "How to Report Missing Persons",
  "abstractText": "Basic instructions for filing a missing person report.",
  "content": "https://cdn.example.com/files/guidelines/missing-person-guide.pdf",
  "createdAt": "2026-02-20T08:00:00+07:00",
  "reporterId": "uuid",
  "isPublic": true
}
```

---

### `CreateGuidelinesDocumentRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `abstractText` | string | yes | Max 500 chars |
| `content` | string | yes | |
| `isPublic` | boolean | no | Default `false` |

---

### `UpdateGuidelinesDocumentRequest`

All fields optional. Same fields as `CreateGuidelinesDocumentRequest`.

---

### `CrimeAnalysisReportResponse`

| Field | Type | Notes |
|-------|------|-------|
| `reportDate` | string (ISO date) | Date the report was generated |
| `totalCrimeReports` | integer | |
| `totalMissingPersonReports` | integer | |
| `crimesBySeverity` | `Record<number, number>` | Key: severity level (1–5), Value: count |
| `crimesByType` | `Record<string, number>` | Key: crime type string, Value: count |
| `totalArrests` | integer | |
| `totalVictims` | integer | |
| `totalOffenders` | integer | |
| `crimeTrend` | `CrimeTrendPoint[]` | Daily counts over the period |
| `hotspots` | `HotspotArea[]` | Geographic clusters |

**`CrimeTrendPoint`**

| Field | Type |
|-------|------|
| `date` | string (ISO date) |
| `count` | integer |

**`HotspotArea`**

| Field | Type |
|-------|------|
| `longitude` | double |
| `latitude` | double |
| `incidentCount` | integer |
| `averageSeverity` | double |

```json
{
  "reportDate": "2026-03-14",
  "totalCrimeReports": 42,
  "totalMissingPersonReports": 10,
  "crimesBySeverity": { "1": 5, "2": 10, "3": 15, "4": 8, "5": 4 },
  "crimesByType": {},
  "totalArrests": 12,
  "totalVictims": 38,
  "totalOffenders": 55,
  "crimeTrend": [
    { "date": "2026-03-01", "count": 3 }
  ],
  "hotspots": [
    { "longitude": 106.7009, "latitude": 10.7769, "incidentCount": 5, "averageSeverity": 3.2 }
  ]
}
```

---

### `FileUploadResponse`

| Field | Type | Notes |
|-------|------|-------|
| `objectName` | string | Generated UUID-based filename |
| `publicUrl` | string | Full public URL to the file |
| `contentType` | string | MIME type |
| `size` | integer | File size in bytes |

```json
{
  "objectName": "550e8400-e29b-41d4-a716-446655440000.jpg",
  "publicUrl": "https://cdn.example.com/criminal-reports/550e8400.jpg",
  "contentType": "image/jpeg",
  "size": 204800
}
```
