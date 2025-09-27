import React from 'react';
import type { StatusOverlayProps } from '../types';

const StatusOverlay: React.FC<StatusOverlayProps> = ({ status, message }) => {
  if (status === 'scanning') return null;

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        );
      case 'success':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-20 h-20 md:w-24 md:h-24 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getAnimationClass = () => {
    switch (status) {
      case 'success':
        return 'pulse-success';
      case 'error':
        return 'shake-error';
      default:
        return '';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
      <div className={`text-center text-white bg-black/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 ${getAnimationClass()}`}>
        {renderIcon()}
        <p className="text-lg md:text-xl font-medium">{message}</p>
      </div>
    </div>
  );
};

export default StatusOverlay;