import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (url: string) => void;
  onScanError: (error: string) => void;
}

interface ScanState {
  status: 'loading' | 'scanning' | 'success' | 'error' | 'permission-denied';
  message: string;
  lastScannedCode?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanState, setScanState] = useState<ScanState>({
    status: 'loading',
    message: 'جاري تحميل الكاميرا...'
  });

  // تحقق من صحة الرابط
  const isValidUrl = useCallback((text: string): boolean => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      // إذا لم يكن نص URL صالح، جرب إضافة https://
      try {
        const url = new URL(`https://${text}`);
        return url.hostname.includes('.');
      } catch {
        return false;
      }
    }
  }, []);

  // معالجة نتيجة المسح
  const handleScanResult = useCallback((result: string) => {
    if (scanState.lastScannedCode === result) {
      return; // تجنب معالجة نفس الكود مرتين
    }

    setScanState(prev => ({ ...prev, lastScannedCode: result }));

    if (isValidUrl(result)) {
      setScanState({
        status: 'success',
        message: 'تم العثور على رابط صالح! جاري التوجيه...',
        lastScannedCode: result
      });
      
      // توجيه فوري للرابط
      setTimeout(() => {
        const finalUrl = result.startsWith('http') ? result : `https://${result}`;
        onScanSuccess(finalUrl);
      }, 1000);
    } else {
      setScanState({
        status: 'error',
        message: 'لم يتم العثور على رابط صالح - استمرار المحاولة...',
        lastScannedCode: result
      });
      onScanError('Invalid URL detected');
      
      // العودة للمسح بعد 2 ثانية
      setTimeout(() => {
        setScanState({
          status: 'scanning',
          message: 'جاري البحث عن الكود...'
        });
      }, 2000);
    }
  }, [scanState.lastScannedCode, isValidUrl, onScanSuccess, onScanError]);

  // بدء الكاميرا والمسح
  const startScanning = useCallback(async () => {
    try {
      setScanState({
        status: 'loading',
        message: 'جاري الوصول للكاميرا...'
      });

      // إنشاء قارئ جديد
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // الحصول على أجهزة الفيديو
      const videoDevices = await reader.listVideoInputDevices();
      
      if (videoDevices.length === 0) {
        throw new Error('لا توجد كاميرا متاحة');
      }

      // استخدام الكاميرا الخلفية إن وجدت (للموبايل)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0].deviceId;

      setScanState({
        status: 'scanning',
        message: 'جاري البحث عن الكود...'
      });

      // بدء المسح المستمر
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            handleScanResult(result.getText());
          }
          // تجاهل الأخطاء العادية (عدم وجود كود في الإطار)
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Scan error:', error);
          }
        }
      );

    } catch (error: unknown) {
      console.error('Camera error:', error);
      
      const errorObj = error as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.message?.includes('Permission')) {
        setScanState({
          status: 'permission-denied',
          message: 'يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح'
        });
      } else {
        setScanState({
          status: 'error',
          message: 'خطأ في الوصول للكاميرا - يرجى إعادة المحاولة'
        });
        onScanError(`Camera error: ${errorObj.message || 'Unknown error'}`);
      }
    }
  }, [handleScanResult, onScanError]);

  // تنظيف الموارد
  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  // بدء المسح عند تحميل المكون
  useEffect(() => {
    startScanning();
    return cleanup;
  }, [startScanning, cleanup]);

  // إعادة المحاولة
  const handleRetry = () => {
    cleanup();
    startScanning();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 arabic">
      {/* العنوان */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          ماسح الباركود والـ QR
        </h1>
        <p className="text-white/80 text-lg">
          وجه الكاميرا نحو الكود للمسح التلقائي
        </p>
      </div>

      {/* منطقة الكاميرا */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative bg-black rounded-2xl shadow-2xl overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-80 object-cover"
            playsInline
            muted
          />
          
          {/* إطار المسح */}
          <div className="absolute inset-4 border-2 border-white/50 rounded-xl">
            <div className="absolute inset-0">
              {/* زوايا الإطار */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white"></div>
              
              {/* خط المسح المتحرك */}
              {scanState.status === 'scanning' && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent scan-line"></div>
              )}
            </div>
          </div>

          {/* تراكب الحالة */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            {scanState.status === 'loading' && (
              <div className="text-center text-white">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">{scanState.message}</p>
              </div>
            )}
            
            {scanState.status === 'success' && (
              <div className="text-center text-white pulse-success">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{scanState.message}</p>
              </div>
            )}
            
            {scanState.status === 'error' && (
              <div className="text-center text-white shake-error">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium">{scanState.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* رسالة الحالة */}
      <div className="mt-6 text-center">
        <p className="text-white/90 text-lg font-medium mb-2">
          {scanState.message}
        </p>
        
        {scanState.status === 'scanning' && (
          <p className="text-white/70 text-sm">
            قرّب الكود من الكاميرا للحصول على أفضل نتيجة
          </p>
        )}
        
        {scanState.status === 'permission-denied' && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-100 text-sm mb-3">
              {scanState.message}
            </p>
            <button
              onClick={handleRetry}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        
        {scanState.status === 'error' && scanState.message.includes('خطأ في الوصول') && (
          <button
            onClick={handleRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors mt-4"
          >
            إعادة المحاولة
          </button>
        )}
      </div>

      {/* تلميحات الاستخدام */}
      <div className="mt-8 max-w-sm text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">نصائح للمسح الأمثل:</h3>
          <ul className="text-white/80 text-sm space-y-1 text-right">
            <li className="flex items-center justify-end">
              <span>تأكد من وضوح الإضاءة</span>
              <span className="ml-2">💡</span>
            </li>
            <li className="flex items-center justify-end">
              <span>اجعل الكود في وسط الإطار</span>
              <span className="ml-2">🎯</span>
            </li>
            <li className="flex items-center justify-end">
              <span>تجنب اهتزاز اليد</span>
              <span className="ml-2">📱</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;