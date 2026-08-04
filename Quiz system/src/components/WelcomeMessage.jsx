import React from 'react';
import { motion } from 'framer-motion';

const WelcomeMessage = ({ user }) => {
  // Extract display name from user metadata, falling back to email username, or generic 'User'
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-2"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        Welcome, {displayName}! 👋
      </h1>
    </motion.div>
  );
};

export default WelcomeMessage;