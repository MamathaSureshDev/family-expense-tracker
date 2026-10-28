import { createClient } from '@supabase/supabase-js'

// Replace these two values with the Project URL and publishable key from Supabase.
// Never put a secret/service-role key in this file.
const supabaseUrl = 'PASTE_YOUR_SUPABASE_URL_HERE'
const supabasePublishableKey = 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE'

export const isConfigured =
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('PASTE_YOUR') &&
  !supabasePublishableKey.includes('PASTE_YOUR')

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabasePublishableKey : 'placeholder-key',
)
