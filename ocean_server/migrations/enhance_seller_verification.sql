-- Migration: Enhance Seller Verification System
-- Date: 2024-01-15
-- Description: Adds comprehensive verification fields to sellers and seller_documents tables

-- Enhance sellers table with new verification fields
ALTER TABLE sellers 
ADD COLUMN verification_expires_at DATETIME NULL COMMENT 'When verification expires and needs renewal',
ADD COLUMN verification_level ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic' COMMENT 'Level of verification achieved',
ADD COLUMN verification_score INT DEFAULT 0 COMMENT 'Overall verification score (0-100)',
ADD COLUMN verification_notes TEXT NULL COMMENT 'Admin notes about verification process',
ADD COLUMN rejection_reason TEXT NULL COMMENT 'Reason for rejection if verification failed',
ADD COLUMN documents_submitted INT DEFAULT 0 COMMENT 'Number of verification documents submitted',
ADD COLUMN documents_approved INT DEFAULT 0 COMMENT 'Number of verification documents approved',
ADD COLUMN last_verification_check DATETIME NULL COMMENT 'Last time verification was reviewed',
ADD COLUMN verified_seller_benefits JSON NULL COMMENT 'Array of benefits this verified seller has access to',
ADD COLUMN trust_score INT DEFAULT 0 COMMENT 'Trust score based on verification, sales, and reviews (0-100)';

-- Update verification status enum to include 'expired'
ALTER TABLE sellers 
MODIFY COLUMN verification_status ENUM('pending', 'rejected', 'approved', 'suspended', 'active', 'expired') DEFAULT 'pending';

-- Enhance seller_documents table with new verification fields
ALTER TABLE seller_documents 
ADD COLUMN document_back_image TEXT NULL COMMENT 'URL or path to back side of document if applicable',
ADD COLUMN document_expiry_date DATE NULL COMMENT 'When the document expires',
ADD COLUMN document_issuing_authority VARCHAR(255) NULL COMMENT 'Authority that issued the document',
ADD COLUMN document_country VARCHAR(100) NULL COMMENT 'Country where document was issued',
ADD COLUMN verified_by UUID NULL COMMENT 'Admin user who verified this document',
ADD COLUMN verification_notes TEXT NULL COMMENT 'Admin notes about document verification',
ADD COLUMN rejection_reason TEXT NULL COMMENT 'Reason for rejection if document was rejected',
ADD COLUMN document_score INT DEFAULT 0 COMMENT 'Verification score for this document (0-100)',
ADD COLUMN is_expired BOOLEAN DEFAULT FALSE COMMENT 'Whether the document has expired',
ADD COLUMN requires_renewal BOOLEAN DEFAULT FALSE COMMENT 'Whether document needs renewal';

-- Update document status enum to include new statuses
ALTER TABLE seller_documents 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'expired', 'under_review') DEFAULT 'pending';

-- Add new document types to the enum
ALTER TABLE seller_documents 
MODIFY COLUMN document_type ENUM('NIN', 'DriversLicense', 'Passport', 'BusinessCertificate', 'BusinessLicense', 'TaxCertificate', 'BankStatement', 'UtilityBill', 'InsuranceCertificate', 'Other') NOT NULL;

-- Add indexes for better performance
CREATE INDEX idx_sellers_verification_level ON sellers(verification_level);
CREATE INDEX idx_sellers_verification_score ON sellers(verification_score);
CREATE INDEX idx_sellers_verification_expires ON sellers(verification_expires_at);
CREATE INDEX idx_sellers_trust_score ON sellers(trust_score);

CREATE INDEX idx_seller_documents_status ON seller_documents(status);
CREATE INDEX idx_seller_documents_score ON seller_documents(document_score);
CREATE INDEX idx_seller_documents_expiry ON seller_documents(document_expiry_date);

-- Add constraints
ALTER TABLE sellers 
ADD CONSTRAINT chk_verification_score 
CHECK (verification_score >= 0 AND verification_score <= 100);

ALTER TABLE sellers 
ADD CONSTRAINT chk_trust_score 
CHECK (trust_score >= 0 AND trust_score <= 100);

ALTER TABLE seller_documents 
ADD CONSTRAINT chk_document_score 
CHECK (document_score >= 0 AND document_score <= 100);

-- Update existing records to set default values
UPDATE sellers 
SET verification_level = 'basic', 
    verification_score = 0, 
    trust_score = 0 
WHERE verification_level IS NULL;

UPDATE seller_documents 
SET document_score = 0, 
    is_expired = FALSE, 
    requires_renewal = FALSE 
WHERE document_score IS NULL;
