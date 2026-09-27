# Seller Verification System API Documentation

## Overview
The enhanced seller verification system provides comprehensive verification workflows for sellers, including document submission, scoring, admin review, and benefit management.

## Base URL
```
/api/seller-verification
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Verification Requirements
**GET** `/requirements`

Get verification requirements based on business category and country.

**Query Parameters:**
- `category` (optional): Business category (basic, business, premium)
- `country` (optional): Country code for country-specific requirements

**Response:**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "basic": [
        {
          "type": "NIN",
          "required": true,
          "description": "National Identification Number"
        }
      ]
    },
    "minimumScore": 70,
    "processingTime": "5-7 business days",
    "nextSteps": [
      "Submit required documents",
      "Wait for admin review"
    ]
  }
}
```

### 2. Submit Verification Application
**POST** `/submit`

Submit a complete verification application with business details and documents.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "businessName": "My Business Name",
  "businessAddress": "123 Business Street",
  "country": "Nigeria",
  "state": "Lagos",
  "category": "business",
  "documents": [
    {
      "documentType": "BusinessCertificate",
      "documentNumber": "BN123456",
      "documentImage": "https://example.com/cert.jpg",
      "documentBackImage": "https://example.com/cert_back.jpg",
      "documentExpiryDate": "2025-12-31",
      "documentIssuingAuthority": "Corporate Affairs Commission",
      "documentCountry": "Nigeria"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification application submitted successfully",
  "data": {
    "sellerId": "uuid",
    "verificationScore": 75,
    "status": "pending"
  }
}
```

### 3. Get Verification Status
**GET** `/status`

Get current verification status and progress for the authenticated seller.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "My Business Name",
    "verificationStatus": "pending",
    "verificationScore": 75,
    "verificationLevel": "basic",
    "documentsSubmitted": 3,
    "documentsApproved": 2,
    "benefits": [
      "Verified seller badge",
      "Enhanced product visibility"
    ],
    "nextSteps": [
      "Wait for admin review (5-7 business days)"
    ],
    "documents": [
      {
        "id": "uuid",
        "documentType": "BusinessCertificate",
        "status": "approved",
        "documentScore": 30
      }
    ]
  }
}
```

## Admin Endpoints

### 4. Review Verification Application
**POST** `/admin/review`

Admin review of verification applications with approval, rejection, or suspension.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "uuid",
  "action": "approve",
  "notes": "All documents verified successfully",
  "documentReviews": [
    {
      "documentId": "uuid",
      "status": "approved",
      "notes": "Document is valid and current"
    }
  ]
}
```

**Actions:**
- `approve`: Approve the verification
- `reject`: Reject with reason
- `suspend`: Temporarily suspend
- `request_more_info`: Request additional documents

**Response:**
```json
{
  "success": true,
  "message": "Verification approved successfully",
  "data": {
    "sellerId": "uuid",
    "newStatus": "approved",
    "verificationScore": 85,
    "verificationLevel": "premium"
  }
}
```

### 5. Get Verification Statistics
**GET** `/admin/stats`

Get comprehensive verification statistics for admin dashboard.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statusBreakdown": [
      {
        "verificationStatus": "pending",
        "count": 25
      },
      {
        "verificationStatus": "approved",
        "count": 150
      }
    ],
    "totalSellers": 200,
    "pendingDocuments": 45,
    "averageVerificationScore": 78
  }
}
```

## Verification Scoring System

### Document Weights
- **NIN**: 25 points
- **BusinessCertificate**: 30 points
- **TaxCertificate**: 20 points
- **BankStatement**: 15 points
- **UtilityBill**: 10 points
- **BusinessLicense**: 25 points
- **InsuranceCertificate**: 20 points
- **DriversLicense**: 15 points
- **Passport**: 15 points

### Verification Levels
- **Basic**: 0-79 points
- **Premium**: 80-89 points
- **Enterprise**: 90-100 points

### Score Calculation
- **Approved**: Full weight points
- **Pending**: 30% of weight points
- **Rejected**: 0 points
- **Expired**: 10% of weight points

## Verification Benefits

### Basic Level (0-79 points)
- Verified seller badge
- Enhanced product visibility
- Access to basic analytics
- Priority customer support

### Premium Level (80-89 points)
- All basic benefits
- Premium placement in search results
- Advanced analytics dashboard
- Featured seller opportunities
- Access to buyer needs board

### Enterprise Level (90-100 points)
- All premium benefits
- Top placement in all listings
- Dedicated account manager
- Custom reporting tools
- Exclusive marketplace features
- API access for bulk operations

## Error Responses

### Common Error Codes
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Status Codes:**
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

## Rate Limiting
- Public endpoints: 100 requests per hour
- Protected endpoints: 1000 requests per hour
- Admin endpoints: 500 requests per hour

## Webhook Notifications
The system sends webhook notifications for:
- Verification status changes
- Document approval/rejection
- Verification expiration warnings
- New verification submissions

## Integration Examples

### Frontend Integration
```javascript
// Submit verification
const submitVerification = async (data) => {
  const response = await fetch('/api/seller-verification/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Get status
const getStatus = async () => {
  const response = await fetch('/api/seller-verification/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Admin Dashboard Integration
```javascript
// Review verification
const reviewVerification = async (reviewData) => {
  const response = await fetch('/api/seller-verification/admin/review', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewData)
  });
  return response.json();
};
```

## Support
For technical support or questions about the verification system, contact the development team or refer to the internal documentation.
