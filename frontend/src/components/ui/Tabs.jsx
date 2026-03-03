import React, { useState } from 'react';

const [activeTab, setActiveTab] = useState('');

export const Tabs = ({ children, defaultValue }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="w-full">
      {React.cloneElement(children, { activeTab: value, setActiveTab: setValue })}
    </div>
  );
};

export const TabsList = ({ children, className = '' }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ children, value, activeTab, setActiveTab, ...props }) => (
  <button
    onClick={() => setActiveTab(value)}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      activeTab === value ? 'bg-background text-foreground shadow-sm' : ''
    }`}
    {...props}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, value, activeTab, ...props }) => (
  activeTab === value && <div {...props}>{children}</div>
);
