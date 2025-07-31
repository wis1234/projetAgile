import React from 'react';
import { Link } from '@inertiajs/react';

const RelatedInfo = ({ icon, title, value, href, className = '' }) => {
  const content = (
    <div className={`flex items-start ${className}`}>
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        {icon}
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {value}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-md transition-colors">
      {content}
    </Link>
  ) : (
    <div className="p-3">
      {content}
    </div>
  );
};

export default RelatedInfo;
