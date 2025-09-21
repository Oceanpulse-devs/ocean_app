-- Migration: Update SellerDocument to allow null documentImage
-- Date: 2024-09-19
-- Description: Allow documentImage to be null for NIN documents

-- Update the documentImage column to allow NULL
ALTER TABLE seller_documents 
MODIFY COLUMN documentImage TEXT NULL 
COMMENT 'URL or path to document image (optional for NIN documents)';

-- Update the documentType enum to include new document types
ALTER TABLE seller_documents 
MODIFY COLUMN documentType ENUM(
  'NIN', 
  'ElectricBill', 
  'IDCard', 
  'DriversLicense', 
  'Passport', 
  'BusinessCertificate', 
  'BusinessLicense', 
  'TaxCertificate', 
  'BankStatement', 
  'UtilityBill', 
  'InsuranceCertificate', 
  'Other'
) NOT NULL;



