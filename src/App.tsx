import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface ScanState {
  status: 'loading' | 'scanning' | 'success' | 'error' | 'permission-denied' | 'stopped';
  message: string;
  lastScannedCode?: string;
  scannedData?: string;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const [scanState, setScanState] = useState<ScanState>({
    status: 'loading',
    message: ''
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [lastOpenedUrl, setLastOpenedUrl] = useState<string>('');
  const isProcessingRef = useRef<boolean>(false);

  // مفتاح التشفير
  const encryptionKey = "MySecretKey2024";

  // فك التشفير
  const decrypt = useCallback((base64Text: string, key: string): string | null => {
    try {
      const text = atob(base64Text);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }, []);

  // تحقق من صحة الرابط
  const isValidUrl = useCallback((text: string): boolean => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      try {
        const url = new URL(`https://${text}`);
        return url.hostname.includes('.');
      } catch {
        return false;
      }
    }
  }, []);

  // معالجة نجاح المسح - فتح الرابط مباشرة في تبويب جديد
  const handleScanSuccess = useCallback((url: string) => {
    console.log('Opening URL:', url);
    
    // عرض الرابط فوق الكاميرا
    setScannedUrl(url);
    setInputValue(url);
    
    // فتح الرابط مباشرة في تبويب جديد منفصل تماماً
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // إخفاء النص بعد نصف ثانية
    setTimeout(() => {
      setScannedUrl('');
    }, 500);
  }, []);

  // معالجة أخطاء المسح
  const handleScanError = useCallback((error: string) => {
    console.warn('Scan error:', error);
  }, []);

  // معالجة نتيجة المسح - النسخة المحدثة والمحسنة
  const handleScanResult = useCallback((result: string) => {
    if (!isScanningRef.current || scanState.lastScannedCode === result || isProcessingRef.current) {
      return;
    }

    // تعيين حالة المعالجة لمنع القراءة المتكررة
    isProcessingRef.current = true;
    setScanState(prev => ({ ...prev, lastScannedCode: result }));

    console.log('Scanned result:', result);
// ✅ إذا النتيجة هي الرقم الخاص افتح الرابط مباشرة
if (result === '442069400596830') {
  const specialUrl = 'https://scanned.page/p/82wMbe';

  if (lastOpenedUrl === specialUrl) {
    console.log('Link already opened, skipping');
    isProcessingRef.current = false;
    return;
  }

  setInputValue(result);
  setLastOpenedUrl(specialUrl);

  // فتح الرابط المخصص مباشرة
  const tempLink = document.createElement('a');
  tempLink.href = specialUrl;
  tempLink.target = '_blank';
  tempLink.rel = 'noopener noreferrer';

  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);

  console.log('Special number link opened automatically');

  setTimeout(() => {
    setLastOpenedUrl('');
    isProcessingRef.current = false;
  }, 5000);

  return; // مهم علشان ما يكمل الكود لباقي الحالات
}
    // محاولة فك تشفير النتيجة أولاً
    const decryptedResult = decrypt(result, encryptionKey);
    console.log('Decrypted result:', decryptedResult);

    // إذا تم فك التشفير بنجاح
    if (decryptedResult && decryptedResult !== result) {
      console.log('Successfully decrypted barcode!');
      
      // عرض رسالة نجاح فك التشفير مع تحديد نوع البيانات
      if (isValidUrl(decryptedResult)) {
        setScannedUrl(`🔓 تم فك تشفير الرابط بنجاح! جاري الفتح...`);
      } else if (decryptedResult === '442069400596830') {
        setScannedUrl(`🔓 تم فك تشفير الرقم المخصص! ${decryptedResult}`);
      } else {
        setScannedUrl(`🔓 تم فك التشفير! البيانات: ${decryptedResult}`);
      }
      
      setTimeout(() => setScannedUrl(''), 4000);

      // التحقق من الرقم المحدد بعد فك التشفير
      if (decryptedResult === '442069400596830') {
        const specialUrl = 'https://scanned.page/p/82wMbe';
        
        if (lastOpenedUrl === specialUrl) {
          console.log('Link already opened, skipping');
          isProcessingRef.current = false;
          return;
        }
        
        setInputValue(decryptedResult);
        setLastOpenedUrl(specialUrl);
        
        // فتح الرابط المخصص مباشرة
        const tempLink = document.createElement('a');
        tempLink.href = specialUrl;
        tempLink.target = '_blank';
        tempLink.rel = 'noopener noreferrer';
        
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        setCameraActive(false);
setTimeout(() => setCameraActive(true), 10000);
        console.log('Special encrypted number link opened automatically');
        
        // إعادة تعيين بعد 5 ثوانِ
        setTimeout(() => {
          setLastOpenedUrl('');
          isProcessingRef.current = false;
        }, 10000);
        
        return;
      }

      // إذا كان الناتج رابطاً بعد فك التشفير
      if (isValidUrl(decryptedResult)) {
        let finalUrl = decryptedResult.startsWith('http') ? decryptedResult : `https://${decryptedResult}`;
        
        // معالجة خاصة للرابط المشفر الجديد
        if (decryptedResult.includes('scanned.page/p/82wMbe')) {
          finalUrl = decryptedResult;
        }
        
        if (lastOpenedUrl === finalUrl) {
          console.log('Link already opened, skipping');
          isProcessingRef.current = false;
          return;
        }
        
        setInputValue(decryptedResult);
        setLastOpenedUrl(finalUrl);
        
        console.log('Opening decrypted URL:', finalUrl);
        
        // فتح الرابط المفكوك التشفير مباشرة
        const tempLink = document.createElement('a');
        tempLink.href = finalUrl;
        tempLink.target = '_blank';
        tempLink.rel = 'noopener noreferrer';
        
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        setCameraActive(false);
setTimeout(() => setCameraActive(true), 10000);
        console.log('Decrypted URL opened automatically:', finalUrl);
        
        setTimeout(() => {
          setLastOpenedUrl('');
          isProcessingRef.current = false;
        }, 5000);
        
        return;
      }

      // إذا كان النص العادي بعد فك التشفير
      setInputValue(decryptedResult);
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(decryptedResult)}`;
      
      const tempLink = document.createElement('a');
      tempLink.href = searchUrl;
      tempLink.target = '_blank';
      tempLink.rel = 'noopener noreferrer';
      
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2000);
      
      return;
    }

    // إذا لم يكن مشفراً، تابع المعالجة العادية
    // التحقق من الرقم المحدد العادي
    if (result === '442069400596830') {
      const specialUrl = 'https://scanned.page/p/82wMbe';
      
      if (lastOpenedUrl === specialUrl) {
        console.log('Link already opened, skipping');
        isProcessingRef.current = false;
        return;
      }
      
      setInputValue(result);
      setLastOpenedUrl(specialUrl);
      
      // فتح الرابط المخصص مباشرة
      const tempLink = document.createElement('a');
      tempLink.href = specialUrl;
      tempLink.target = '_blank';
      tempLink.rel = 'noopener noreferrer';
      
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      console.log('Special number link opened automatically');
      
      setTimeout(() => {
        setLastOpenedUrl('');
        isProcessingRef.current = false;
      }, 5000);
      
      return;
    }

    // المعالجة العادية للباركودات غير المشفرة
    setInputValue(result);
    
    // تحضير الرابط للفتح
    let finalUrl = result;
    
    if (isValidUrl(result)) {
      finalUrl = result.startsWith('http') ? result : `https://${result}`;
    } else {
      // للنصوص العادية، جرب البحث في Google
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(result)}`;
    }
    
    // التحقق من عدم فتح نفس الرابط مرتين
    if (lastOpenedUrl === finalUrl) {
      console.log('Link already opened, skipping');
      isProcessingRef.current = false;
      return;
    }
    
    console.log('Opening URL automatically:', finalUrl);
    setLastOpenedUrl(finalUrl);
    
    // إنشاء رابط مؤقت وتفعيله تلقائياً
    const tempLink = document.createElement('a');
    tempLink.href = finalUrl;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    
    console.log('Link clicked automatically');
    
    // إعادة تعيين بعد 5 ثوانِ
    setTimeout(() => {
      setLastOpenedUrl('');
      isProcessingRef.current = false;
    }, 5000);
  }, [scanState.lastScannedCode, isValidUrl, lastOpenedUrl, decrypt, encryptionKey]);

  // باقي الكود يبقى كما هو...
  // بدء الكاميرا والمسح
  const startScanning = useCallback(async () => {
    if (isScanningRef.current) {
      console.log('Scanner already running');
      return;
    }

    console.log('Starting camera...');
    try {
      setScanState({
        status: 'loading',
        message: ''
      });

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const videoDevices = await reader.listVideoInputDevices();
      
      if (videoDevices.length === 0) {
        throw new Error('لا توجد كاميرا متاحة');
      }

      let selectedDeviceId = videoDevices[0].deviceId;
      
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        selectedDeviceId = backCamera.deviceId;
      } else if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      }

      setScanState({
        status: 'scanning',
        message: ''
      });

      isScanningRef.current = true;
      console.log('Camera started successfully');

      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result && isScanningRef.current) {
            handleScanResult(result.getText());
          }
          if (error && !(error instanceof NotFoundException) && isScanningRef.current) {
            console.warn('Scan error:', error);
          }
        }
      );

    } catch (error: unknown) {
      console.error('Camera error:', error);
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
        handleScanError(`Camera error: ${errorObj.message || 'Unknown error'}`);
      }
    }
  }, [handleScanResult, handleScanError]);

  // تنظيف الموارد
  const cleanup = useCallback(() => {
    isScanningRef.current = false;
    isProcessingRef.current = false;
    
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannedUrl('');
    setLastOpenedUrl('');
  }, []);

  // بدء المسح عند تحميل المكون
  useEffect(() => {
    if (cameraActive) {
      startScanning();
    }
    return cleanup;
  }, [cameraActive, startScanning, cleanup]);

  // إيقاف/تشغيل الكاميرا
  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      console.log('Stopping camera...');
      isScanningRef.current = false;
      
      if (readerRef.current) {
        try {
          readerRef.current.reset();
          readerRef.current = null;
        } catch (error) {
          console.warn('Error stopping reader:', error);
        }
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        videoRef.current.srcObject = null;
      }
      
      setScannedUrl('');
      setCameraActive(false);
      console.log('Camera stopped');
    } else {
      console.log('Starting camera...');
      setCameraActive(true);
    }
  }, [cameraActive]);

  // معالجة قراءة من حقل الإدخال (بقيت كما كانت)
  const handleManualRead = useCallback(() => {
    if (inputValue.length >= 12) {
      // التحقق من الرقم المحدد
      if (inputValue === '442069400596830') {
        window.open('https://scanned.page/82wMbe', '_blank');
        return;
      }
      
      if (isValidUrl(inputValue)) {
        handleScanSuccess(inputValue);
      } else {
        const iframe = document.querySelector('iframe[name="iframe_qr"]') as HTMLIFrameElement;
        if (iframe) {
          iframe.src = '';
        }
        alert('النص المدخل ليس رابطاً صالحاً');
      }
    } else {
      alert('يجب أن لا يقل رمز الاستجابة السريعة عن 12 رقم');
    }
  }, [inputValue, isValidUrl, handleScanSuccess]);

  return (
    <>
      <noscript>
        <strong>We're sorry but الصفحة الرئيسية doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
      </noscript>
      
      <div data-v-0785c210="" id="app" className="rtl">
        <div data-v-0785c210="" className="page-wrapper">
          <div data-v-d8b7d370="" data-v-0785c210="" className="row">
            
            {/* القسم الأول: قارئ QR */}
            <div data-v-d8b7d370="" id="colum" className="box col-lg-6 col-md-6 col-sm-12">
              {/* الرأس */}
              <div data-v-d8b7d370="" className="banner">
                <img data-v-d8b7d370="" src="qr_read.png" alt="QR Code" title="قراءة رمز الاستجابة السريعة" style={{padding: '8px'}} />
                <span data-v-d8b7d370="" className="font " style={{fontSize: '2.2rem'}}>قراءة رمز الاستجابة السريعة</span>
              </div>
              
              {/* منطقة الكاميرا */}
              <div data-v-d8b7d370="" id="camera" className="outcamera">
                <div data-v-d8b7d370="" id="camera2" className="camera">
                  <div 
                    data-v-35411cc1="" 
                    data-v-d8b7d370="" 
                    className="qrcode-stream-wrapper" 
                    style={{
                      width: '100%', 
                      height: window.innerWidth <= 768 ? '300px' : '700px',
                      position: 'relative'
                    }}
                  >
                    <video 
                      ref={videoRef}
                      data-v-35411cc1="" 
                      autoPlay 
                      muted 
                      playsInline 
                      className={`qrcode-stream-camera ${!cameraActive ? 'qrcode-stream-camera--hidden' : ''}`}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                    <canvas data-v-35411cc1="" className="qrcode-stream-camera"></canvas>
                    <canvas data-v-35411cc1="" className="qrcode-stream-overlay"></canvas>
                    <div data-v-35411cc1="" className="qrcode-stream-overlay"></div>
                    
                    {/* عرض رسالة فك التشفير */}
                    {scannedUrl && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#00ff00',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: '20px 30px',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        zIndex: 1000,
                        maxWidth: '90%',
                        textAlign: 'center',
                        wordBreak: 'break-all',
                        boxShadow: '0 6px 20px rgba(0, 255, 0, 0.3)',
                        border: '2px solid #00ff00'
                      }}>
                        {scannedUrl}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* زر إيقاف الكاميرا */}
              <div data-v-d8b7d370="" className="form-group row" style={{position: 'relative', zIndex: 1000}}>
                <button 
                  data-v-d8b7d370="" 
                  type="button" 
                  className="btn btn-primary" 
                  style={{marginRight: 'auto', marginLeft: 'auto', width: '200px', marginBottom: '40px', cursor: 'pointer', position: 'relative', zIndex: 1001}}
                  onClick={toggleCamera}
                >
                  {cameraActive ? 'ايقاف الكاميرا' : 'تشغيل الكاميرا'}
                </button>
              </div>
              
              {/* حقل إدخال رمز QR - بقي كما كان */}
              <div data-v-d8b7d370="" className="form-group row">
                <div data-v-d8b7d370="" className="col-sm-4" style={{textAlign: 'center'}}>
                  <label data-v-d8b7d370="" htmlFor="QR" className="col-form-label" style={{color: 'rgb(44, 125, 191)', fontSize: '1.3rem'}}>
                    رمز الاستجابة السريعة
                  </label>
                </div>
                <div data-v-d8b7d370="" className="col-sm-6">
                  <input 
                    data-v-d8b7d370="" 
                    type="text" 
                    placeholder="رمز الاستجابة السريعة" 
                    className="form-control input-field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <i data-v-d8b7d370="" style={{color: '#000000', fontFamily: 'Almarai,sans-serif'}}>
                    يجب ان لايقل رمز الاستجابة السريعة عن 12 رقم
                  </i>
                </div>
                <div data-v-d8b7d370="" className="col-sm-2">
                  <button 
                    data-v-d8b7d370="" 
                    type="submit" 
                    className="btn btn-red"
                    onClick={handleManualRead}
                  >
                    قراءة
                  </button>
                </div>
              </div>
              
              <div data-v-d8b7d370=""></div>
            </div>
            
            {/* القسم الثاني: عرض الملف */}
            <div data-v-d8b7d370="" className="col-sm-12 col-md-10 col-lg-6 mt-2" style={{marginLeft: 'auto', marginRight: 'auto'}}>
              <span data-v-d8b7d370="">عرض الملف بنافذة جديدة:</span>
              <br data-v-d8b7d370="" />
              <br data-v-d8b7d370="" />
              <iframe 
                data-v-d8b7d370="" 
                name="iframe_qr" 
                width="95%" 
                height="90%" 
                src="" 
                title="document" 
                className="framediv desktop-pdf"
              ></iframe>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* حاويات التنبيهات */}
      <div>
        <div>
          <div className="Vue-Toastification__container top-left"></div>
        </div>
        <div>
          <div className="Vue-Toastification__container top-center"></div>
        </div>
        <div>
          <div className="Vue-Toastification__container top-right"></div>
        </div>
        <div>
          <div className="Vue-Toastification__container bottom-left"></div>
        </div>
        <div>
          <div className="Vue-Toastification__container bottom-center"></div>
        </div>
        <div>
          <div className="Vue-Toastification__container bottom-right"></div>
        </div>
      </div>
    </>
  );
}

export default App;