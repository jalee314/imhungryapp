-- Create a function to check if email/phone/username already exists
-- This function can be called by anonymous users (anon role) during signup validation

-- Function to check if email exists
CREATE OR REPLACE FUNCTION check_email_exists(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user" 
    WHERE email = email_input
  );
END;
$$;

-- Function to check if phone number exists
CREATE OR REPLACE FUNCTION check_phone_exists(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user" 
    WHERE phone_number = phone_input
  );
END;
$$;

-- Function to check if username exists
CREATE OR REPLACE FUNCTION check_username_exists(username_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user" 
    WHERE display_name = username_input
  );
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION check_email_exists TO anon;
GRANT EXECUTE ON FUNCTION check_phone_exists TO anon;
GRANT EXECUTE ON FUNCTION check_username_exists TO anon;