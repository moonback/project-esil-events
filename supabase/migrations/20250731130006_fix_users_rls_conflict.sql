/*
  # Fix RLS conflicts for users table

  This migration fixes the 406 error by:
  1. Dropping conflicting policies
  2. Creating proper policies that work with the existing structure
  3. Ensuring users can read their own profile and admins can read all users
*/

-- Drop the problematic policy from the previous migration
DROP POLICY IF EXISTS "Allow all authenticated users to read users" ON users;

-- Drop other potentially conflicting policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create proper policies that work with the existing structure

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for admins to read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 