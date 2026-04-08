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
