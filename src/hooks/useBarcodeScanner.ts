import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import type { ScanState, UseBarcodeScanner } from '../types';

export const useBarcodeScanner = ({ onScanSuccess, onScanError }: UseBarcodeScanner) => {
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

  // إعادة المحاولة
  const handleRetry = useCallback(() => {
    cleanup();
    startScanning();
  }, [cleanup, startScanning]);

  // بدء المسح عند تحميل المكون
  useEffect(() => {
    startScanning();
    return cleanup;
  }, [startScanning, cleanup]);

  return {
    videoRef,
    scanState,
    handleRetry
  };
};