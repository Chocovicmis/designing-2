/*
  # Enable Supabase Auth Password Protection

  1. Security Enhancement
    - This migration documents the enablement of Supabase Auth's compromised password check
    - The feature checks passwords against HaveIBeenPwned.org database
    - Prevents users from setting passwords that have been compromised in data breaches

  2. Configuration
    - This setting must be enabled in the Supabase Dashboard under:
    - Authentication > Providers > Email > Require email verified
    - And in Security settings: Enable "Check password with Have I Been Pwned"
    
  3. How it Works
    - When a user signs up or changes their password, Supabase checks the password against the HaveIBeenPwned API
    - If the password is found in compromised databases, the user is prevented from using it
    - This happens transparently without exposing the user's full password
    - Only a partial hash is sent to the service (k-anonymity model)

  4. User Experience
    - Users will receive an error if they try to set a compromised password
    - Error message: "Password is compromised or breached"
    - Users are encouraged to choose a unique, strong password

  5. Implementation Note
    - This is a server-side setting in Supabase Dashboard
    - No code changes required in the application
    - All authentication flows automatically benefit from this protection
*/

SELECT 1;