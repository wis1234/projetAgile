export const isAdminUser = (user) => {
  if (!user) return false;
  
  try {
    // Check explicit email allowlist for super admin fallback
    const superAdminEmails = ['admin@quiz.com', 'ronaldoagbohou@gmail.com'];
    if (user.email && superAdminEmails.includes(user.email)) return true;

    // Check role property (populated from DB in AuthContext) or metadata
    const role = user.role || user.user_metadata?.role;
    return role === 'admin' || role === 'super_admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const isSuperAdmin = (user) => {
  if (!user) return false;
  
  try {
    // Check explicit email allowlist
    const superAdminEmails = ['admin@quiz.com', 'ronaldoagbohou@gmail.com'];
    if (user.email && superAdminEmails.includes(user.email)) return true;

    // Check role property
    const role = user.role || user.user_metadata?.role;
    return role === 'super_admin';
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return false;
  }
};

export const getRedirectPath = (user) => {
  if (!user) return '/login';
  
  try {
    // Redirect both admin and super_admin types to /admin/dashboard
    if (isAdminUser(user)) {
      return '/admin/dashboard';
    }
    
    return '/dashboard';
  } catch (error) {
    console.error("Error determining redirect path:", error);
    return '/dashboard';
  }
};

export const getUserRole = (user) => {
  if (!user) return null;
  
  try {
    const superAdminEmails = ['admin@quiz.com', 'ronaldoagbohou@gmail.com'];
    if (user.email && superAdminEmails.includes(user.email)) return 'super_admin';
    
    // Prioritize DB role attached to user object, then metadata, then default to user
    return user.role || user.user_metadata?.role || 'user';
  } catch (error) {
    console.error("Error getting user role:", error);
    return 'user';
  }
};