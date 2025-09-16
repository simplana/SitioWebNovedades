import React from 'react';
import { CreditCard, Shield, Zap } from 'lucide-react';

interface PagueloFacilButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
}

const PagueloFacilButton: React.FC<PagueloFacilButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg'
  };

  const baseClasses = `
    font-bold rounded-lg transition-all duration-300 transform
    flex items-center justify-center space-x-2
    shadow-lg hover:shadow-xl
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 
      hover:from-blue-700 hover:to-blue-800
      text-white border-2 border-blue-600
      hover:scale-105 active:scale-95
    `,
    secondary: `
      bg-white border-2 border-blue-600 
      text-blue-600 hover:bg-blue-50
      hover:border-blue-700 hover:text-blue-700
      hover:scale-105 active:scale-95
    `,
    minimal: `
      bg-transparent border border-blue-600 
      text-blue-600 hover:bg-blue-600 hover:text-white
      hover:scale-105 active:scale-95
    `
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          <div className="flex items-center space-x-2">
            <div className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-black">
              Paguelo
            </div>
            <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-black">
              Fácil
            </div>
          </div>
          <CreditCard className="h-5 w-5" />
        </>
      )}
    </button>
  );
};

export default PagueloFacilButton;