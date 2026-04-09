-- Required roles for Supabase stack
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;

CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN PASSWORD 'postgres';
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgres';

-- Grant roles to authenticator (PostgREST switches between them per request)
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_auth_admin TO postgres;
ALTER ROLE supabase_auth_admin SET search_path = auth;

-- Create auth schema for GoTrue
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;

-- Allow supabase_auth_admin to create schemas (GoTrue runs migrations)
GRANT CREATE ON DATABASE postgres TO supabase_auth_admin;
GRANT ALL ON SCHEMA public TO supabase_auth_admin;

-- Schema access for API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
