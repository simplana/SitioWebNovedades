import React from 'react';
import { Shield, Zap, CheckCircle, CreditCard } from 'lucide-react';

interface PagueloFacilPaymentCardProps {
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

const PagueloFacilPaymentCard: React.FC<PagueloFacilPaymentCardProps> = ({
  isSelected,
  onSelect,
  className = ''
}) => {
  return (
    <div 
      className={`
        border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 
        ${isSelected 
          ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-105' 
          : 'border-gray-200 hover:border-blue-400 hover:shadow-md hover:scale-102'
        }
        ${className}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="radio"
            checked={isSelected}
            onChange={onSelect}
            className="text-blue-600 focus:ring-blue-500 h-5 w-5"
          />
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-lg text-sm font-bold">
              Paguelo Fácil
            </div>
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
              SEGURO
            </div>
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="h-6 w-6 text-blue-600" />
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-lg">
          Pago Seguro con Paguelo Fácil
        </h3>
        
        <p className="text-gray-600 text-sm">
          Paga de forma rápida y segura con tu cuenta Paguelo Fácil. 
          Acepta tarjetas de crédito, débito y transferencias bancarias.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Shield className="h-4 w-4 text-green-500" />
            <span>100% Seguro</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Pago Rápido</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <span>Multi-método</span>
          </div>
        </div>

        {/* Logos de tarjetas aceptadas */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">Acepta:</span>
          <div className="flex space-x-1">
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">VISA</div>
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">MC</div>
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">AMEX</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagueloFacilPaymentCard;