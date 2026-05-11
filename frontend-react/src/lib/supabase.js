import { createClient } from '@supabase/supabase-js'

// Substitua pelos valores do seu projeto Supabase
// Encontre em: Dashboard Supabase → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL  || 'https://SEU_PROJETO.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUA_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
