import React from 'react';

export const Label = ({ children, htmlFor, className = '' }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium text-gray-700 leading-none ${className}`}
  >
    {children}
  </label>
);

export default Label;
