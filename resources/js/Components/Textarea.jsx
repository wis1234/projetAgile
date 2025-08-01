import React from 'react';

export default function Textarea({
    id,
    name,
    value,
    className = '',
    onChange,
    disabled = false,
    rows = 3,
    ...props
}) {
    return (
        <textarea
            id={id || name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={rows}
            className={`
                border-gray-300 dark:border-gray-700 dark:bg-gray-900 
                dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-600 
                focus:ring-blue-500 dark:focus:ring-blue-600 rounded-md shadow-sm 
                w-full ${className}
            `}
            {...props}
        />
    );
}

Textarea.displayName = 'Textarea';
