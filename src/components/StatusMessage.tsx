import React from 'react';
import type { StatusMessageProps } from '../types';

const StatusMessage: React.FC<StatusMessageProps> = ({ status, message, onRetry }) => {
  return (
    <div className="mt-8 md:mt-12 text-center">
      <p className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl font-medium mb-4">
        {message}
      </p>
      
      {status === 'scanning' && (
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl">
          قرّب الكود من الكاميرا للحصول على أفضل نتيجة
        </p>
      )}
      
      {status === 'permission-denied' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 md:p-8 mt-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <p className="text-red-800 dark:text-red-200 text-lg md:text-xl mb-6">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl text-lg md:text-xl font-medium transition-colors shadow-lg"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}
      
      {status === 'error' && message.includes('خطأ في الوصول') && onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl text-lg md:text-xl font-medium transition-colors mt-6 shadow-lg"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

export default StatusMessage;