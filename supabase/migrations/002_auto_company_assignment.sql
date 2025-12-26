-- This migration adds a trigger to automatically create a company and assign the user to it
-- when they sign up with a company_name in their user metadata.

-- Function to handle new user signup and auto-assign company
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  company_name_input TEXT;
  new_company_id UUID;
  existing_company_id UUID;
BEGIN
  -- Get company_name from user's raw_user_meta_data
  company_name_input := NEW.raw_user_meta_data->>'company_name';
  
  -- If no company name provided, do nothing (user will need manual assignment)
  IF company_name_input IS NULL OR company_name_input = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if a company with this name already exists (case-insensitive)
  SELECT id INTO existing_company_id
  FROM companies
  WHERE LOWER(name) = LOWER(company_name_input)
  LIMIT 1;
  
  IF existing_company_id IS NOT NULL THEN
    -- Company exists, add user to existing company as member
    new_company_id := existing_company_id;
  ELSE
    -- Create new company
    INSERT INTO companies (name)
    VALUES (company_name_input)
    RETURNING id INTO new_company_id;
  END IF;
  
  -- Add user to company (admin if they created it, member if joining existing)
  INSERT INTO user_companies (user_id, company_id, role)
  VALUES (
    NEW.id,
    new_company_id,
    CASE WHEN existing_company_id IS NULL THEN 'admin' ELSE 'member' END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_company ON auth.users;
CREATE TRIGGER on_auth_user_created_company
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_company();

-- Also handle updates to user metadata (in case company_name is set after initial creation)
CREATE OR REPLACE FUNCTION public.handle_user_company_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  company_name_input TEXT;
  new_company_id UUID;
  existing_company_id UUID;
  user_has_company BOOLEAN;
BEGIN
  -- Only proceed if raw_user_meta_data changed
  IF OLD.raw_user_meta_data = NEW.raw_user_meta_data THEN
    RETURN NEW;
  END IF;

  -- Get company_name from new user metadata
  company_name_input := NEW.raw_user_meta_data->>'company_name';
  
  -- If no company name provided, do nothing
  IF company_name_input IS NULL OR company_name_input = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if user already has a company assignment
  SELECT EXISTS(
    SELECT 1 FROM user_companies WHERE user_id = NEW.id
  ) INTO user_has_company;
  
  -- If user already has a company, don't change it
  IF user_has_company THEN
    RETURN NEW;
  END IF;
  
  -- Check if a company with this name already exists (case-insensitive)
  SELECT id INTO existing_company_id
  FROM companies
  WHERE LOWER(name) = LOWER(company_name_input)
  LIMIT 1;
  
  IF existing_company_id IS NOT NULL THEN
    new_company_id := existing_company_id;
  ELSE
    -- Create new company
    INSERT INTO companies (name)
    VALUES (company_name_input)
    RETURNING id INTO new_company_id;
  END IF;
  
  -- Add user to company
  INSERT INTO user_companies (user_id, company_id, role)
  VALUES (
    NEW.id,
    new_company_id,
    CASE WHEN existing_company_id IS NULL THEN 'admin' ELSE 'member' END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated_company ON auth.users;
CREATE TRIGGER on_auth_user_updated_company
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_company_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON user_companies TO authenticated;

-- Also add insert policy for companies (allow creating companies during signup)
CREATE POLICY "Allow service role and triggers to create companies"
  ON companies FOR INSERT
  WITH CHECK (true);

-- Policy to allow authenticated users to insert into user_companies (for the trigger)
-- This is handled by SECURITY DEFINER on the function, but we also need a policy
-- for when the trigger runs
CREATE POLICY "Allow triggers to create user_company links"
  ON user_companies FOR INSERT
  WITH CHECK (user_id = auth.uid() OR current_user = 'authenticator');
