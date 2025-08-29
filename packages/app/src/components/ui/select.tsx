import React, { useState } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: any) => void;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return (
    <button className={`flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md ${className}`}>
      {children}
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}>
      {children}
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ children, value, className = '' }) => {
  return (
    <div className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${className}`}>
      {children}
    </div>
  );
};
