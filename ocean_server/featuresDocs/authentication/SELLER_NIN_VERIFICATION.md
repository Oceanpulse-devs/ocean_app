# 🪪 Automated Seller Identity & NIN Verification System

This document details the **Automated Seller Identity Verification Pipeline** in `ocean_server`, featuring **Biometric Facial Recognition** (camera selfie vs. NIMC record photo) powered by Dojah API, AES-256 NIN Encryption, and Verification Leveling.

---

## 📌 Architectural Overview & Design Philosophy

To prevent seller fraud and identity spoofing on the marketplace, seller onboarding incorporates an automated identity verification engine:
1. **Biometric Face Matching**: The seller submits an 11-digit NIN and takes a live camera selfie. Dojah API queries official government NIMC records (`POST /api/v1/kyc/nin/verify`) and biometrically compares the selfie against the NIMC photo.
2. **Confidence Thresholding**: Verification only succeeds if Dojah returns a facial match confidence score $\ge 60\%$. If the selfie does not match the NIMC photo, the endpoint returns an exact 400 error: `"Face verification failed. The selfie provided does not match the photo on your NIMC record."`
3. **AES-256 NIN Encryption**: Raw 11-digit NIN numbers are **NEVER** stored in plain text. They are encrypted using AES-256-CBC algorithm prior to database persistence.
4. **NIN Masking**: Document records display only masked NIN representations (e.g. `123****8901`).
5. **Instant Account Upgrade**: Upon successful biometric verification:
   - `users.accountStatus` transitions to `'active'`.
   - `users.accountType` transitions to `'seller'`.
   - `sellers.isVerified` becomes `true` (`verificationStatus = 'approved'`).
   - A `SellerDocument` record is automatically created/updated with the Cloudinary selfie URL.

---

## 🗄️ Database Schemas & Audit Trail

### 1. `seller_verification_logs` Table
Audit trail logging every Dojah verification attempt.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `seller_id` (UUID, Foreign Key -> `sellers.id`, Nullable)
- `verification_type` (`VARCHAR`): Set to `'NIN_FACIAL_DOJAH'`.
- `nin_number` (`TEXT`): AES-256 Encrypted NIN string.
- `nimc_first_name` (`VARCHAR`): Official first name retrieved from NIMC.
- `nimc_last_name` (`VARCHAR`): Official last name retrieved from NIMC.
- `nimc_dob` (`VARCHAR`): Official date of birth from NIMC.
- `nimc_phone` (`VARCHAR`): Official phone number from NIMC.
- `nimc_state` (`VARCHAR`): Official state of residence from NIMC.
- `nimc_photo_url` (`TEXT`): Cloudinary URL of selfie photo.
- `dojah_reference_id` (`VARCHAR`): Dojah API tracking reference ID.
- `confidence_score` (`DECIMAL(5,2)`): Facial match percentage score (e.g., `94.80`).
- `status` (`ENUM`: `'approved'`, `'rejected'`, `'failed'`).
- `failure_reason` (`TEXT`, Nullable).
- `raw_response` (`JSON`): Complete raw NIMC response data.

### 2. `seller_documents` Table
Document verification state displayed in admin panel and seller profile.
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key -> `sellers.id`)
- `document_type` (`ENUM`: `'NIN'`, `'DriversLicense'`, `'Passport'`, `'BusinessCertificate'`, `'BusinessLicense'`).
- `document_number` (`VARCHAR`): Masked NIN representation (e.g. `123****8901`).
- `document_image` (`TEXT`): Cloudinary URL of selfie/document image.
- `status` (`ENUM`: `'pending'`, `'approved'`, `'rejected'`).
- `verified_at` (`DATETIME`).
- `verification_notes` (`TEXT`).

---

## ⚙️ Biometric Verification Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Seller (Mobile/Web)
    participant API as SellerVerificationController
    participant Dojah as Dojah API Engine
    participant Cloudinary as Cloudinary Storage
    participant DB as MySQL Database

    Seller->>API: POST /api/seller-verification/verify-nin (nin, selfieImage, businessName, etc.)
    API->>API: Validate 11-digit NIN & Selfie file/base64 payload
    API->>Cloudinary: Upload selfie image to seller-documents/selfies/
    Cloudinary-->>API: Return secure_url
    API->>Dojah: verifyNinWithFace(nin, selfieCloudinaryUrl)
    alt Dojah Service Success
        Dojah-->>API: Return { match: true, confidence: 94.8, trackingId, nimcData }
        API->>API: Encrypt NIN via AES-256 (encryptNin) & Mask NIN (123****8901)
        API->>DB: Log attempt in seller_verification_logs (status: 'approved')
        API->>DB: Create/Update SellersTable (isVerified: true, verificationStatus: 'approved')
        API->>DB: Update UserTable (accountStatus: 'active', accountType: 'seller', sellerId: seller.id)
        API->>DB: Upsert SellerDocument (documentType: 'NIN', documentImage: selfieUrl)
        API-->>Seller: 200 OK (Verification Successful, Seller Account Active)
    else Face Mismatch or Failed Confidence
        Dojah-->>API: Return { match: false, confidence: 32.1, trackingId }
        API->>DB: Log attempt in seller_verification_logs (status: 'rejected')
        API-->>Seller: 400 Bad Request ("Face verification failed. The selfie provided does not match...")
    end
```

---

## 🔌 API Endpoints Reference

### Verification API Routes

| HTTP Method | Endpoint Path | Payload / Query | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/seller-verification/verify-nin` | `{ nin, selfieImage, businessName, businessAddress, state }` | Primary automated NIN & facial recognition verification |
| `POST` | `/api/seller-verification/nin` | `{ nin, selfieImage, businessName, businessAddress, state }` | Alias endpoint for backward compatibility |
| `POST` | `/api/seller-verification/submit` | Multipart: `businessDocument`, `personalId`, text fields | Manual document submission for admin review |
| `GET` | `/api/seller-verification/status` | Header: `Authorization: Bearer <token>` | Fetch seller's current verification status & score |
| `GET` | `/api/seller-verification/requirements` | Public | Fetch verification levels requirements list |

### Admin Moderation Routes (Admin Auth Required)

| HTTP Method | Endpoint Path | Payload | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/seller-verification/admin/review` | `{ sellerId, status, rejectionReason }` | Admin manual approval or rejection of seller application |
| `GET` | `/api/seller-verification/admin/stats` | Header: `Authorization: Bearer <token>` | Fetch platform-wide verification stats breakdown |

---

## 🛠️ Audit Summary & Improvements Made

During the system audit of Seller Verification:
1. **Fixed `accountType` Update Bug**: Corrected `user.update({ accountStatus: 'active', role: 'seller' })` to `user.update({ accountStatus: 'active', accountType: 'seller', sellerId: seller.id })`. This ensures the user's role is properly updated in MySQL database schemas.
2. **Account Status ENUM Alignment**: Aligned `accountStatus` ENUM values across `UserTable` (`'active'`, `'pending'`, `'suspended'`, `'deactivated'`) to eliminate MySQL ENUM data truncation errors.
3. **AES-256 Storage Security**: Confirmed that `encryptNin` and `decryptNin` use AES-256-CBC encryption to guarantee raw government NIN numbers are protected at rest.
