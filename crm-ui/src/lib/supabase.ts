import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzndhzqpywixpxlpxzsl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bmRoenFweXdpeHB4bHB4enNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1OTQyNDksImV4cCI6MjA2MTE3MDI0OX0.ClJuFob7ZsbHXMyBYDu5X6g6lYpcCB85VgdmfC9qGtM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 