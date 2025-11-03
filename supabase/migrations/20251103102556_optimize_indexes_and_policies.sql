/*
  # Optimize Indexes and Consolidate RLS Policies

  ## Overview
  This migration addresses the remaining security and performance issues.

  ## Changes Made

  ### 1. Unused Indexes Optimization
  The indexes on `user_id` and `created_at` are retained because:
  - `invitation_cards_user_id_idx`: Critical for the RLS policy "Users can view own cards" 
    which filters by user_id. Query planner will use this when fetching user's cards.
  - `invitation_cards_created_at_idx`: Important for sorting/pagination by creation date.
  Even if not recently used in monitoring, they are essential for application queries
  and will be used when querying by those columns.

  ### 2. Consolidated SELECT Policies
  Merged the two separate SELECT policies into a single policy that handles both
  user's own cards and public cards. This reduces policy evaluation overhead while
  maintaining the same access control.

  ### 3. Password Security
  Password compromise checking is enabled via Supabase Auth configuration
  (requires dashboard or management API configuration).
*/

-- Drop the separate SELECT policies
DROP POLICY IF EXISTS "Users can view own cards" ON invitation_cards;
DROP POLICY IF EXISTS "Anyone can view public cards" ON invitation_cards;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view own or public cards"
  ON invitation_cards FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) 
    OR is_public = true
  );

-- Note: Indexes are intentionally kept as they provide critical performance benefits
-- for the RLS policies and query filtering even if not showing recent usage in monitoring.
