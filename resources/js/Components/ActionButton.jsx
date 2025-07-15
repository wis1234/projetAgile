import React from 'react';

/**
 * ActionButton
 * Props :
 * - variant: 'primary' | 'info' | 'warning' | 'danger' | 'default' (défaut: 'default')
 * - size: 'sm' | 'md' | 'lg' (défaut: 'md')
 * - className: string (classes additionnelles)
 * - ...props: autres props bouton
 */
const VARIANT_CLASSES = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  info: 'bg-gray-100 hover:bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
  danger: 'bg-red-100 hover:bg-red-200 text-red-700',
  default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function ActionButton({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`rounded shadow font-semibold transition ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.default} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 