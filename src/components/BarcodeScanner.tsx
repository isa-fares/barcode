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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 arabic bg-gray-50 dark:bg-gray-900">
      {/* العنوان */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
          ماسح الباركود والـ QR
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xl md:text-2xl">
          وجه الكاميرا نحو الكود للمسح التلقائي
        </p>
      </div>

      {/* منطقة الكاميرا */}
      <div className="relative w-full max-w-md md:max-w-2xl mx-auto">
        <div className="relative bg-black rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          <video
            ref={videoRef}
            className="w-full h-80 md:h-96 lg:h-[500px] object-cover"
            playsInline
            muted
          />
          
          {/* إطار المسح */}
          <div className="absolute inset-6 md:inset-8 border-2 border-blue-500/70 rounded-2xl">
            <div className="absolute inset-0">
              {/* زوايا الإطار */}
              <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-4 border-r-4 border-blue-500"></div>
              
              {/* خط المسح المتحرك */}
              {scanState.status === 'scanning' && (
                <div className="absolute inset-x-0 top-0 h-1 md:h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent scan-line"></div>
              )}
            </div>
          </div>

          {/* تراكب الحالة */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            {scanState.status === 'loading' && (
              <div className="text-center text-white bg-black/50 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg md:text-xl font-medium">{scanState.message}</p>
              </div>
            )}
            
            {scanState.status === 'success' && (
              <div className="text-center text-white pulse-success bg-black/50 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg md:text-xl font-medium">{scanState.message}</p>
              </div>
            )}
            
            {scanState.status === 'error' && (
              <div className="text-center text-white shake-error bg-black/50 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-lg md:text-xl font-medium">{scanState.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* رسالة الحالة */}
      <div className="mt-8 md:mt-12 text-center">
        <p className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl font-medium mb-4">
          {scanState.message}
        </p>
        
        {scanState.status === 'scanning' && (
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl">
            قرّب الكود من الكاميرا للحصول على أفضل نتيجة
          </p>
        )}
        
        {scanState.status === 'permission-denied' && (
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
              {scanState.message}
            </p>
            <button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl text-lg md:text-xl font-medium transition-colors shadow-lg"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        
        {scanState.status === 'error' && scanState.message.includes('خطأ في الوصول') && (
          <button
            onClick={handleRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-xl text-lg md:text-xl font-medium transition-colors mt-6 shadow-lg"
          >
            إعادة المحاولة
          </button>
        )}
      </div>

      {/* تلميحات الاستخدام */}
      <div className="mt-12 md:mt-16 max-w-lg md:max-w-2xl text-center">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-white font-semibold mb-6 text-xl md:text-2xl">نصائح للمسح الأمثل:</h3>
          <ul className="text-slate-600 dark:text-slate-300 text-lg md:text-xl space-y-4 text-right">
            <li className="flex items-center justify-end">
              <span>تأكد من وضوح الإضاءة</span>
              <div className="mr-4 w-8 h-8 md:w-10 md:h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </li>
            <li className="flex items-center justify-end">
              <span>اجعل الكود في وسط الإطار</span>
              <div className="mr-4 w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </li>
            <li className="flex items-center justify-end">
              <span>تجنب اهتزاز اليد</span>
              <div className="mr-4 w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;