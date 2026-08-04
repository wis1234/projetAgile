# Row Level Security (RLS) Testing Guide

After updating the Supabase RLS policies to fix infinite recursion errors, please use this guide to verify that everything works correctly. 

## Automated Test Script (Browser Console)
Log in as an **Admin** or **Super Admin**, then paste the following test script into your browser's Developer Tools Console. It will quickly verify that all tables are queryable without triggering recursion errors.