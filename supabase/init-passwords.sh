#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<-EOSQL
    ALTER USER authenticator WITH PASSWORD '${POSTGRES_PASSWORD}';
    ALTER USER supabase_auth_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
EOSQL
