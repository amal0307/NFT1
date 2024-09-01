import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and Anon Key
const supabaseUrl = 'https://njlndbldinkavmsdklby.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbG5kYmxkaW5rYXZtc2RrbGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1MzA4NTYsImV4cCI6MjAzOTEwNjg1Nn0.L1xQepHWSdL8AE-Ep3VQPWFrF-Nh0OgBwYpyrderc3E';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
