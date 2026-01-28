-- Add auth column to requests table for authorization configuration
ALTER TABLE requests ADD COLUMN auth TEXT DEFAULT NULL;
