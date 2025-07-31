/*
  # Fix RLS INSERT policy for users table

  1. Security Changes
    - Drop existing INSERT policy if it exists
    - Create new INSERT policy allowing users to insert their own profile
    - Policy ensures auth.uid() matches the id being inserted

  This migration fixes the RLS policy violation that prevents new users
  from creating their profile during signup.
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create INSERT policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;