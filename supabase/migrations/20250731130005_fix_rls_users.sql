/*
  # Fix RLS issues for users table

  This migration ensures that:
  1. RLS is properly disabled on the users table
  2. All existing policies are dropped to avoid conflicts
  3. Users can read their own profile without issues
*/

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create a simple policy that allows all authenticated users to read all users
-- This is a temporary fix for development
CREATE POLICY "Allow all authenticated users to read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a policy that allows users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 