'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey } from './env'

export function createClient() {
  const key = supabaseAnonKey()
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error('Supabase env is not configured.')
  }
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key)
}
