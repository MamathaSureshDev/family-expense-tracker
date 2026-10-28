import { createClient } from '@supabase/supabase-js'

// Replace these two values with the Project URL and publishable key from Supabase.
// Never put a secret/service-role key in this file.
const supabaseUrl = 'https://jcoxjaxmbfnluvahyhoo.supabase.co'
const supabasePublishableKey = 'sb_publishable_-c8x738tUefoy8vxFb6dnw_C6s4oEmE'

export const isConfigured =
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('PASTE_YOUR') &&
  !supabasePublishableKey.includes('PASTE_YOUR')

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabasePublishableKey : 'placeholder-key',
)
