// console.log('env check', { url: import.meta.env.VITE_SUPABASE_URL,anon: !!import.meta.env.VITE_SUPABASE_ANON_KEY })
// console.log('supaReady?', !!((import.meta?.env?.VITE_SUPABASE_URL) &&  (import.meta?.env?.VITE_SUPABASE_ANON_KEY)))


import { createClient } from '@supabase/supabase-js'

// Read env in a way Vite can statically replace during dev/build
const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env

export const supabase = (VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY)
  ? createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  : null
