-- Row Level Security (RLS) Policies for NFC Loyalty Program
-- Run this after the schema.sql in your Supabase SQL editor

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Helper function to get current user's store_id
CREATE OR REPLACE FUNCTION current_user_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT store_id FROM users WHERE id = auth.uid();
$$;

-- STORES TABLE POLICIES
-- Super admins can do everything
CREATE POLICY "Super admins can manage all stores" ON stores
  FOR ALL USING (
    current_user_role() = 'super_admin'
  );

-- Store owners can view their own store
CREATE POLICY "Store owners can view their store" ON stores
  FOR SELECT USING (
    current_user_role() = 'owner' AND 
    id = current_user_store_id()
  );

-- Staff can view their store
CREATE POLICY "Staff can view their store" ON stores
  FOR SELECT USING (
    current_user_role() = 'staff' AND 
    id = current_user_store_id()
  );

-- Customers can view stores they interact with
CREATE POLICY "Customers can view stores they have points for" ON stores
  FOR SELECT USING (
    current_user_role() = 'customer' AND 
    id IN (
      SELECT store_id FROM points WHERE user_id = auth.uid()
    )
  );

-- USERS TABLE POLICIES
-- Super admins can view all users
CREATE POLICY "Super admins can view all users" ON users
  FOR SELECT USING (
    current_user_role() = 'super_admin'
  );

-- Store owners can view users in their store
CREATE POLICY "Store owners can view their store users" ON users
  FOR SELECT USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id()
  );

-- Staff can view users in their store
CREATE POLICY "Staff can view their store users" ON users
  FOR SELECT USING (
    current_user_role() = 'staff' AND 
    store_id = current_user_store_id()
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Super admins can insert any user
CREATE POLICY "Super admins can insert users" ON users
  FOR INSERT WITH CHECK (
    current_user_role() = 'super_admin'
  );

-- Store owners can insert staff for their store
CREATE POLICY "Store owners can insert staff" ON users
  FOR INSERT WITH CHECK (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id() AND 
    role IN ('staff')
  );

-- Users can insert themselves as customers
CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (
    id = auth.uid() AND 
    role = 'customer'
  );

-- Super admins can update any user
CREATE POLICY "Super admins can update users" ON users
  FOR UPDATE USING (
    current_user_role() = 'super_admin'
  );

-- Store owners can update staff in their store
CREATE POLICY "Store owners can update staff" ON users
  FOR UPDATE USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id() AND 
    role IN ('staff')
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    id = auth.uid()
  );

-- POINTS TABLE POLICIES
-- Super admins can view all points
CREATE POLICY "Super admins can view all points" ON points
  FOR SELECT USING (
    current_user_role() = 'super_admin'
  );

-- Store owners can view points for their store
CREATE POLICY "Store owners can view store points" ON points
  FOR SELECT USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id()
  );

-- Staff can view points for their store
CREATE POLICY "Staff can view store points" ON points
  FOR SELECT USING (
    current_user_role() = 'staff' AND 
    store_id = current_user_store_id()
  );

-- Customers can view their own points
CREATE POLICY "Customers can view own points" ON points
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Customers can insert points for themselves
CREATE POLICY "Customers can request points" ON points
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    status = 'pending'
  );

-- Staff can update points in their store
CREATE POLICY "Staff can approve points" ON points
  FOR UPDATE USING (
    current_user_role() = 'staff' AND 
    store_id = current_user_store_id() AND 
    status = 'pending'
  );

-- Store owners can update points in their store
CREATE POLICY "Store owners can approve points" ON points
  FOR UPDATE USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id() AND 
    status = 'pending'
  );

-- REWARDS TABLE POLICIES
-- Super admins can view all rewards
CREATE POLICY "Super admins can view all rewards" ON rewards
  FOR SELECT USING (
    current_user_role() = 'super_admin'
  );

-- Store owners can view their store rewards
CREATE POLICY "Store owners can view store rewards" ON rewards
  FOR SELECT USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id()
  );

-- Staff can view their store rewards
CREATE POLICY "Staff can view store rewards" ON rewards
  FOR SELECT USING (
    current_user_role() = 'staff' AND 
    store_id = current_user_store_id()
  );

-- Customers can view rewards for stores they interact with
CREATE POLICY "Customers can view store rewards" ON rewards
  FOR SELECT USING (
    current_user_role() = 'customer' AND 
    store_id IN (
      SELECT store_id FROM points WHERE user_id = auth.uid()
    )
  );

-- Store owners can manage their store rewards
CREATE POLICY "Store owners can manage rewards" ON rewards
  FOR ALL USING (
    current_user_role() = 'owner' AND 
    store_id = current_user_store_id()
  );

-- Anti-cheat: Prevent duplicate point requests within 5 minutes
CREATE POLICY "Prevent duplicate point requests" ON points
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    store_id NOT IN (
      SELECT store_id FROM points 
      WHERE user_id = auth.uid() 
        AND status = 'pending' 
        AND requested_at > NOW() - INTERVAL '5 minutes'
    )
  );
