import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): SupabaseClient<any> {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
    }
    _client = createClient(url, key)
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop: string | symbol): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabase() as any
    return client[prop]
  }
})
