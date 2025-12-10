
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  subLabel?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, subLabel, error, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700 flex justify-between items-center ml-1">
        {label}
        {subLabel && <span className="text-xs text-gray-500 font-normal">{subLabel}</span>}
      </label>
      <input
        className={`px-4 py-3 border rounded-xl focus:ring-2 focus:ring-apple-500 focus:border-apple-500 outline-none transition-all text-base ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50/50 focus:bg-white'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
};
