# MySQL Integration Setup Guide

This document explains how to set up, configure, and verify the MySQL integration for this dashboard application using Supabase Edge Functions.

## 1. Configure Supabase Edge Function Secrets

To connect to your Hostinger MySQL database securely, you must store your database credentials as encrypted secrets in your Supabase project. The application's Edge Functions will read these secrets securely at runtime.

### Required Secrets

You need to add the following secrets to Supabase:

*   `MYSQL_HOST`: `auth-db1941.hstgr.io`
*   `MYSQL_PORT`: `3306`
*   `MYSQL_DATABASE`: `u978666307_projasurvey`
*   `MYSQL_USER`: `u978666307_projasurvey` (Alternatively `MYSQL_USERNAME`)
*   `MYSQL_PASSWORD`: Your actual Hostinger database password

*Note: You also need Survey Solutions credentials (`SURVEY_SOLUTIONS_URL`, `SURVEY_SOLUTIONS_USERNAME`, `SURVEY_SOLUTIONS_PASSWORD`) which should already be configured.*

### How to set secrets in Supabase CLI (if running locally):
Run the following commands in your terminal: