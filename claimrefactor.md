# Claims Module Refactor

## Overview
Refactor claims module from 4-status to 7-status workflow with ClaimInvoice and ClaimReprocess tables.

---

## New Models

### ClaimInvoice
Tracks individual invoices/receipts submitted for reimbursement.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| claimId | String | FK to Claim |
| invoiceNumber | String | Invoice number from provider |
| providerName | String | Medical provider name |
| amountSubmitted | Float | Amount on this invoice |
| createdById | String | User who added this invoice |
| createdAt | DateTime | When added |

### ClaimReprocess
Tracks each reprocess cycle when insurer requests more information.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| claimId | String | FK to Claim |
| reprocessDate | Date | Date of reprocess |
| reprocessDescription | String | Why reprocessing was needed |
| businessDays | Int? | Business days for this cycle |
| createdById | String | User who created record |
| createdAt | DateTime | When created |

### Updated Claim Fields

**Remove:** `type`, `amount`, `approvedAmount`, `resolvedDate`

**Keep:** `description`

**Add:**
| Field | Type | Description |
|-------|------|-------------|
| careType | CareType? | Ambulatory, Hospitalization, etc. |
| diagnosisCode | String? | ICD code |
| diagnosisDescription | String? | Diagnosis text |
| amountSubmitted | Float? | Total valor presentado |
| incidentDate | Date? | Fecha de Incurrencia |
| submittedDate | Date? | Fecha de Presentación |
| businessDays | Int? | Días Laborables |
| amountApproved | Float? | Liquidado |
| amountDenied | Float? | Gastos No Elegibles |
| amountUnprocessed | Float? | Gastos No Procesados |
| deductibleApplied | Float? | Aplicación de Deducible |
| copayApplied | Float? | Copago |
| settlementDate | Date? | Fecha de Liquidación |
| settlementNumber | String? | Número de Liquidación |
| settlementNotes | String? | Observaciones |
| updatedById | String? | Last user to update |

**Relations:**
- `invoices: ClaimInvoice[]`
- `reprocesses: ClaimReprocess[]`

---

## Enums

### ClaimStatus
```
DRAFT         - Initial data entry
PENDING_INFO  - Insurer requested more information
VALIDATION    - Internal review before sending
SUBMITTED     - Sent to insurer (Tramitado)
RETURNED      - Returned by insurer (Terminal)
SETTLED       - Settlement received (Terminal)
CANCELLED     - Cancelled (Terminal)
```

### CareType
```
AMBULATORY
HOSPITALIZATION
MATERNITY
EMERGENCY
OTHER
```

---

## State Machine

```
DRAFT → VALIDATION | CANCELLED
VALIDATION → SUBMITTED | RETURNED | CANCELLED
SUBMITTED → PENDING_INFO | SETTLED | CANCELLED
PENDING_INFO → SUBMITTED | CANCELLED

Terminal States: RETURNED, SETTLED, CANCELLED
```

### Visual Flow
```
┌─────────┐
│  DRAFT  │
└────┬────┘
     │
     ▼
┌────────────┐      ┌──────────┐
│ VALIDATION │─────►│ RETURNED │ (Terminal)
└─────┬──────┘      └──────────┘
      │
      ▼
┌───────────┐      ┌─────────┐
│ SUBMITTED │─────►│ SETTLED │ (Terminal)
└─────┬─────┘      └─────────┘
      │
      ▼
┌──────────────┐
│ PENDING_INFO │───► (back to SUBMITTED with ClaimReprocess)
└──────────────┘

Any State ───► CANCELLED (Terminal)
```

---

## Transition Rules

### DRAFT → VALIDATION
**Requirements:**
- careType (required)
- incidentDate (required)
- submittedDate (required)
- amountSubmitted (required)
- diagnosisDescription (required)
- patientId (required)

### VALIDATION → SUBMITTED
**Requirements:** Confirmation only (all DRAFT→VALIDATION fields still required)

### VALIDATION → RETURNED
**Requirements:** Confirmation only

### SUBMITTED → PENDING_INFO
**Requirements:** Confirmation only

### SUBMITTED → SETTLED
**Requirements:**
- amountDenied (required)
- amountUnprocessed (required)
- deductibleApplied (required)
- copayApplied (required)
- settlementDate (required)
- settlementNumber (required)

### PENDING_INFO → SUBMITTED
**Requirements:**
- reprocessDate (required) → Creates ClaimReprocess record
- reprocessDescription (required) → Creates ClaimReprocess record

### Any → CANCELLED
**Requirements:** Confirmation only

---

## Editability Rules

1. **Non-terminal states** (DRAFT, PENDING_INFO, VALIDATION, SUBMITTED): All fields editable
2. **Terminal states** (RETURNED, SETTLED, CANCELLED): All fields locked
3. **Cumulative validation**: Once a field is required by a passed transition, it cannot be cleared/nulled
4. **Invoice management**: Can add/remove ClaimInvoice records in non-terminal states

---

## Backend Files to Modify

### Schema
- `api/prisma/schema.prisma`

### Lifecycle
- `api/src/features/claims/shared/claimLifecycle.blueprint.ts`
- `api/src/features/claims/shared/claimLifecycle.validator.ts`

### DTOs
- `api/src/features/claims/new/newClaim.dto.ts`
- `api/src/features/claims/views/viewClaims.dto.ts`
- `api/src/features/claims/views/claimDetail.dto.ts`
- `api/src/features/claims/edit/claimEdit.dto.ts`

### Schemas
- `api/src/features/claims/new/newClaim.schema.ts`
- `api/src/features/claims/views/viewClaims.schema.ts`
- `api/src/features/claims/edit/claimEdit.schema.ts`

### Services
- `api/src/features/claims/new/newClaim.service.ts`
- `api/src/features/claims/views/viewClaims.service.ts`
- `api/src/features/claims/views/claimDetail.service.ts`
- `api/src/features/claims/edit/claimEdit.service.ts`

### New Routes (ClaimInvoice)
- `api/src/features/claims/invoices/addClaimInvoice.dto.ts`
- `api/src/features/claims/invoices/addClaimInvoice.schema.ts`
- `api/src/features/claims/invoices/addClaimInvoice.service.ts`
- `api/src/features/claims/invoices/addClaimInvoice.route.ts`
- `api/src/features/claims/invoices/removeClaimInvoice.dto.ts`
- `api/src/features/claims/invoices/removeClaimInvoice.schema.ts`
- `api/src/features/claims/invoices/removeClaimInvoice.service.ts`
- `api/src/features/claims/invoices/removeClaimInvoice.route.ts`

### App Registration
- `api/src/app.ts`

---

## Execution Order

1. Prisma schema migration
2. Lifecycle blueprint + validator
3. DTOs and schemas
4. Services (edit service is the most complex)
5. ClaimInvoice routes
6. Register routes in app.ts
