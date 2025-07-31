/*
  # Fix users table INSERT policy

  1. Security Changes
    - Drop existing INSERT policy that may be misconfigured
    - Create new INSERT policy with proper WITH CHECK clause
    - Ensure authenticated users can insert their own profile during signup

  This fixes the RLS violation error during user registration.
*/

-- Drop the existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new INSERT policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);