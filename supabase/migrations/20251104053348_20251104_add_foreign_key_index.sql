/*
  # Add index on user_id foreign key

  1. Indexes
    - Add index on `invitation_cards.user_id` foreign key for improved query performance
    - This prevents sequential scans when filtering by user_id

  2. Purpose
    - Optimize queries that filter invitation cards by user
    - Improve performance of joins with auth.users table
    - Follow database best practices for foreign keys
*/

CREATE INDEX IF NOT EXISTS idx_invitation_cards_user_id ON public.invitation_cards(user_id);