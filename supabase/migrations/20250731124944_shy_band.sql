/*
  # Add INSERT policy for users table

  1. Security
    - Add policy allowing authenticated users to insert their own profile
    - Ensures users can only create profiles with their own auth.uid()
*/

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);