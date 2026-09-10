-- Migration: add end_time and is_featured to events table
-- Run in Supabase SQL Editor -> New Query -> Run

ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
