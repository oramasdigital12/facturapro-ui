import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ExpandableTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  expandedHeight?: string;
}

export default function ExpandableTextarea({
  label,
  value,
  onChange,
  placeholder = '',
  error,
  icon,
  className = '',
  minHeight = 'min-h-[100px]',
  maxHeight = 'max-h-[200px]',
  expandedHeight = 'min-h-[400px]'
}: ExpandableTextareaProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </label>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pl-12 pr-16 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30' 
              : 'border-gray-200 dark:border-gray-600'
          } ${
            isExpanded ? expandedHeight : minHeight
          } ${maxHeight}`}
        />
        
        {/* Icono izquierdo */}
        {icon && (
          <div className="absolute left-4 top-4 text-gray-400">
            {icon}
          </div>
        )}
        
        {/* Botón expandir/contraer */}
        <button
          type="button"
          onClick={toggleExpanded}
          className="absolute right-3 top-3 p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-all duration-200 hover:scale-110 group"
          title={isExpanded ? 'Contraer' : 'Expandir'}
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
          )}
        </button>
        
        {/* Indicador de estado */}
        <div className="absolute right-12 top-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
            isExpanded 
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
          }`}>
            {isExpanded ? 'Expandido' : 'Compacto'}
          </div>
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
          <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
          {error}
        </div>
      )}
      
      {/* Contador de caracteres */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
        {value.length} caracteres
      </div>
    </div>
  );
}
