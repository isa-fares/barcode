import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import type { ScanState, UseBarcodeScanner } from '../types';

export const useBarcodeScanner = ({ onScanSuccess, onScanError }: UseBarcodeScanner) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isScanningRef = useRef<boolean>(false);
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
    // التحقق من أن المسح ما زال نشطاً
    if (!isScanningRef.current || scanState.lastScannedCode === result) {
      return; // تجنب معالجة إذا توقف المسح أو تكرار نفس الكود
    }

    // إيقاف المسح فوراً
    isScanningRef.current = false;

    // إيقاف المسح ونهائياً
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        // إيقاف تدفق الفيديو بالكامل
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.warn('Error stopping scanner:', error);
      }
    }

    setScanState(prev => ({ ...prev, lastScannedCode: result }));

    // التحقق من وجود رابط
    if (isValidUrl(result)) {
      // فتح الرابط مباشرة بدون انتظار
      const finalUrl = result.startsWith('http') ? result : `https://${result}`;
      onScanSuccess(finalUrl);
    } else {
      // إذا لم يكن رابط، إيقاف المسح وعرض المعلومات
      setScanState({
        status: 'stopped',
        message: 'تم إيقاف المسح - اضغط إعادة المسح للمتابعة',
        lastScannedCode: result,
        scannedData: result
      });
    }
  }, [scanState.lastScannedCode, isValidUrl, onScanSuccess]);

  // بدء الكاميرا والمسح
  const startScanning = useCallback(async () => {
    // تجنب بدء المسح إذا كان قيد التشغيل بالفعل
    if (isScanningRef.current) {
      return;
    }

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

      // إجبار استخدام الكاميرا الخلفية في الموبايل
      let selectedDeviceId = videoDevices[0].deviceId;
      
      // البحث عن الكاميرا الخلفية أولاً
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      // في الموبايل، استخدم الكاميرا الخلفية حصرياً
      if (backCamera && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        selectedDeviceId = backCamera.deviceId;
      } else if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      }

      setScanState({
        status: 'scanning',
        message: 'جاري البحث عن الكود...'
      });

      // تفعيل المسح
      isScanningRef.current = true;

      // بدء المسح المستمر
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result && isScanningRef.current) {
            handleScanResult(result.getText());
          }
          // تجاهل الأخطاء العادية (عدم وجود كود في الإطار)
          if (error && !(error instanceof NotFoundException) && isScanningRef.current) {
            console.warn('Scan error:', error);
          }
        }
      );

    } catch (error: unknown) {
      console.error('Camera error:', error);
      
      // إيقاف المسح في حالة الخطأ
      isScanningRef.current = false;
      
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
    // إيقاف المسح
    isScanningRef.current = false;
    
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    // إيقاف تدفق الفيديو
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // إعادة المحاولة
  const handleRetry = useCallback(() => {
    cleanup();
    startScanning();
  }, [cleanup, startScanning]);

  // إعادة تشغيل المسح بعد الإيقاف
  const restartScanning = useCallback(() => {
    // تنظيف الموارد أولاً
    cleanup();
    setScanState({
      status: 'loading',
      message: 'جاري إعادة تشغيل المسح...'
    });
    // إعادة تشغيل المسح
    setTimeout(() => {
      startScanning();
    }, 100);
  }, [cleanup, startScanning]);

  // بدء المسح عند تحميل المكون
  useEffect(() => {
    startScanning();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    scanState,
    handleRetry,
    restartScanning
  };
};