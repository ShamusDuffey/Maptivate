import {loadPin, getUser, checkSession} from home.js;
const SUPABASE_URL = 'https://tckolgmxbedfuytfkudh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRja29sZ214YmVkZnV5dGZrdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjY3MjMsImV4cCI6MjA1MDUwMjcyM30.FEemUUeRDJwT8s98mY2sZa0xwlh72EJQlzO7Kxa2uIA';
let session;
let USER;
const sb = supabase.createClient(SUPABASE_URL, supabaseKey);

