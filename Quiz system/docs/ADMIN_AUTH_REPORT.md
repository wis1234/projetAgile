# ProJA Survey Solutions - Admin Authentication & Authorization Report

This document provides a comprehensive analysis of the admin login system, authentication flow, and role-based access control within the ProJA Survey Solutions project.

---

## 1. Admin Login Files

The authentication and admin login systems are distributed across several frontend files that handle UI, state management, and role verification:

*   **Admin Login Page/Component**: 
    *   `src/pages/LoginPage.jsx` (Main login UI)
    *   `src/pages/Login.jsx` (Alternative/legacy login UI)
*   **Authentication Handlers**: 
    *   `src/contexts/SupabaseAuthContext.jsx` (Manages global auth state, interacts with Supabase)
    *   `src/contexts/AuthContext.jsx` (Legacy context)
*   **Admin Role Verification & Credential Checks**: 
    *   `src/utils/authUtils.js` (Contains the core logic for verifying if a user is an admin or super_admin)
*   **Auth Cleanup & Utils**:
    *   `src/utils/authCleanup.js` (Handles session teardown on logout)

---

## 2. Configuration Files

Admin settings, routes, and role enforcement are configured in the following files:

*   **Admin Routes Definition**: 
    *   `src/App.jsx` (Defines the routing architecture and wraps admin routes in `<AdminRoute>`)
*   **Admin Role Checking Implementation**: 
    *   `src/components/AdminRoute.jsx` (React Router middleware that intercepts unauthorized access)
*   **Admin UI/Settings Configuration**:
    *   `src/pages/AdminDashboard.jsx` (Main layout and navigation for the admin panel)
    *   `src/components/Header.jsx` (Conditionally renders admin navigation links based on role)

---

## 3. Database Configuration

*   **Supabase Connection Configuration**: 
    *   Location: `src/lib/customSupabaseClient.js`
    *   Uses: `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets to establish the connection.
*   **User Roles Database Schema**: 
    *   Table: `public.users`
    *   Key Columns: `id` (uuid), `email` (text), `full_name` (text), `role` (text).
*   **Admin User Data Storage**: 
    *   All user and admin accounts are centrally stored in the Supabase Auth (`auth.users`) table for identity management.
    *   Extended profile data and roles are stored in the `public.users` table, which is synchronized via the `handle_new_user()` PostgreSQL trigger.

---

## 4. Authentication Flow Documentation

### Step-by-Step Flow:
1.  **Submission**: The user enters their email and password in `src/pages/LoginPage.jsx`.
2.  **API Call (Password Verification)**: The form calls `signIn(email, password)` from `SupabaseAuthContext.jsx`. This function delegates password verification directly to Supabase's secure backend via `supabase.auth.signInWithPassword()`.
3.  **Session Establishment**: If credentials are correct, Supabase returns a session token (JWT).
4.  **Role Hydration**: The `handleSession` function in `SupabaseAuthContext.jsx` detects the successful login, extracts the user ID, and queries the `public.users` table to fetch the user's explicit role (`admin`, `super_admin`, or `user`).
5.  **State Update**: The fetched role is attached to the `user` object in the React context state.
6.  **Role Checking & Routing**: The router redirects the user to `/admin/dashboard` or `/dashboard` based on `getRedirectPath(user)` from `src/utils/authUtils.js`.
7.  **Authorization Enforcement**: If the user tries to navigate to an admin-only URL (e.g., `/admin/*`), `src/components/AdminRoute.jsx` intercepts the request. It calls `isAdminUser(user)`. If false, it forcefully redirects the user back to the standard dashboard.

---

## 5. Detailed File Inventory

### `src/utils/authUtils.js`
*   **Purpose**: Centralizes the logic for checking user permissions and generating redirect paths.
*   **Key Functions**: `isAdminUser`, `isSuperAdmin`, `getRedirectPath`, `getUserRole`.
*   **Relation to Admin Auth**: This is the ultimate source of truth in the frontend for determining if a user holds administrative privileges.
*   **Code Snippet**: