import React from 'react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import Header from './Header';
import CameraFrame from './CameraFrame';
import StatusOverlay from './StatusOverlay';
import StatusMessage from './StatusMessage';
import ScanningTips from './ScanningTips';
import type { BarcodeScannerProps } from '../types';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const { videoRef, scanState, handleRetry } = useBarcodeScanner({
    onScanSuccess,
    onScanError
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 arabic bg-gray-50 dark:bg-gray-900">
      <Header 
        title="ماسح الباركود والـ QR"
        subtitle="وجه الكاميرا نحو الكود للمسح التلقائي"
      />

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

      <StatusMessage 
        status={scanState.status}
        message={scanState.message}
        onRetry={handleRetry}
      />

      <ScanningTips />
    </div>
  );
};

export default BarcodeScanner;