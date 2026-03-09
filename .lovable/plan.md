

## Problem Analysis

The batch upload is failing with "You must be logged in to save batch predictions" despite the user thinking they're logged in. After examining the code, I've identified **two critical issues**:

### Issue 1: No Real Authentication System
The application has a **fake login system**. Looking at `LoginPage.tsx` (lines 17-28), the login form doesn't actually authenticate users with the backend - it just navigates to the dashboard after a 500ms delay. There's no call to `supabase.auth.signIn()` or any authentication service.

```typescript
// Current login - FAKE
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Demo mode: skip actual auth
  setLoading(true);
  setTimeout(() => {
    navigate("/dashboard");  // Just navigates, no auth!
  }, 500);
};
```

### Issue 2: Database Has No Users
Query results from `auth.users` show **zero users** in the database. Even if authentication was working, there are no user accounts.

### Why BatchPage.tsx Fails
Line 89-92 in `BatchPage.tsx` calls `supabase.auth.getUser()` to verify authentication before saving predictions. Since no one is actually logged in (the login is fake), this returns `null`, triggering the error.

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  throw new Error("You must be logged in to save batch predictions");  // ← Fails here
}
```

## Implementation Plan

### 1. **Replace Fake Login with Real Supabase Authentication**
   - Update `LoginPage.tsx` to use `supabase.auth.signInWithPassword()`
   - Update `RegisterPage.tsx` to use `supabase.auth.signUp()`
   - Add proper error handling for auth failures
   - Store session state properly

### 2. **Create Protected Route Wrapper**
   - Build an `AuthGuard` component that checks authentication status
   - Redirect unauthenticated users to `/login`
   - Wrap all protected routes (dashboard, batch, history, assessment) with this guard

### 3. **Add Auth State Management**
   - Create `AuthProvider` context to share auth state across the app
   - Listen to `supabase.auth.onAuthStateChange()` for session updates
   - Provide user info to all components

### 4. **Fix Navigation Flow**
   - Add logout functionality in the sidebar
   - Ensure proper redirects after login/register
   - Handle session expiration gracefully

### 5. **Database Considerations**
   The `applications` table already has proper RLS policies that check `auth.uid() = user_id`. Once real authentication is implemented, these will work correctly.

## Technical Details

**Auth Flow:**
```
User enters credentials → supabase.auth.signInWithPassword() 
  → Session created → User object stored 
  → Navigate to /dashboard → Protected routes check session
  → Batch upload can access user.id for RLS policies
```

**Files to Modify:**
- `src/pages/LoginPage.tsx` - Implement real login
- `src/pages/RegisterPage.tsx` - Implement real signup  
- `src/App.tsx` - Add AuthProvider and route protection
- `src/components/AppSidebar.tsx` - Add logout button
- Create new: `src/contexts/AuthContext.tsx` - Auth state management
- Create new: `src/components/AuthGuard.tsx` - Route protection

**Edge Cases:**
- Email verification (can disable for dev via Supabase settings)
- Password reset flow
- Session refresh on page reload
- Concurrent sessions

