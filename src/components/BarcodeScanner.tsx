import React from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import Header from './Header';
import CameraFrame from './CameraFrame';
import StatusOverlay from './StatusOverlay';
import StatusMessage from './StatusMessage';
import ScanningTips from './ScanningTips';
import type { BarcodeScannerProps } from '../types';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const { videoRef, scanState, handleRetry, restartScanning } = useBarcodeScanner({
    onScanSuccess,
    onScanError
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 arabic bg-gray-50 dark:bg-gray-900">
      <Header 
        title="ماسح الباركود والـ QR"
        subtitle="وجه الكاميرا نحو الكود للمسح التلقائي"
      />

      {/* عرض الكاميرا عندما لا يكون هناك كود مقروء */}
      {scanState.status !== 'stopped' && scanState.status !== 'success' && (
        <div className="relative">
          <CameraFrame 
            videoRef={videoRef}
            isScanning={scanState.status === 'scanning'}
          />
          <StatusOverlay 
            status={scanState.status}
            message={scanState.message}
          />
        </div>
      )}

      {/* عرض المعلومات مكان الكاميرا عند قراءة الكود */}
      {(scanState.status === 'stopped' || scanState.status === 'success') && scanState.scannedData && (
        <div className="relative w-full max-w-2xl md:max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 border-2 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4">
                تم قراءة الكود بنجاح!
              </h3>
              
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 md:p-6 mb-6">
                <h4 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  المحتوى:
                </h4>
                <div className="bg-white dark:bg-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-500">
                  <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg break-all font-mono">
                    {scanState.scannedData}
                  </p>
                </div>
              </div>
              
              <button
                onClick={restartScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 md:px-12 md:py-5 rounded-xl text-lg md:text-xl font-medium transition-colors shadow-lg w-full"
              >
                مسح رمز جديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* عرض رسائل الحالة للحالات الأخرى */}
      {scanState.status !== 'stopped' && scanState.status !== 'success' && (
        <StatusMessage 
          status={scanState.status}
          message={scanState.message}
          onRetry={handleRetry}
          onRestart={restartScanning}
          scannedData={scanState.scannedData}
        />
      )}

      <ScanningTips />
    </div>
  );
};

export default BarcodeScanner;