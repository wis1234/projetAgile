export const parseSyncError = (error) => {
  console.error("Original Sync Error:", error);
  
  if (!error) {
    return {
      message: "An unknown error occurred during synchronization.",
      action: "Please try again or contact support."
    };
  }

  const errorMsg = typeof error === 'string' ? error : error.message || error.details || JSON.stringify(error);
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('timeout')) {
    return {
      message: "Network connection issue detected.",
      details: errorMsg,
      action: "Check your internet connection and try again. The server might be unreachable."
    };
  }

  if (lowerMsg.includes('auth') || lowerMsg.includes('jwt') || lowerMsg.includes('unauthorized')) {
    return {
      message: "Authentication failed.",
      details: errorMsg,
      action: "Please log out and log in again to refresh your session."
    };
  }

  if (lowerMsg.includes('relation') || lowerMsg.includes('does not exist') || lowerMsg.includes('table')) {
    return {
      message: "Database schema error.",
      details: errorMsg,
      action: "The required database tables are missing. Please contact an administrator to run migrations."
    };
  }

  if (lowerMsg.includes('policy') || lowerMsg.includes('rls') || lowerMsg.includes('permission denied')) {
    return {
      message: "Permission denied.",
      details: errorMsg,
      action: "You do not have the required permissions to perform this action."
    };
  }

  return {
    message: "Synchronization failed.",
    details: errorMsg,
    action: "Review the system logs or try testing the connection in Settings."
  };
};