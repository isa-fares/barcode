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

  // معالجة نجاح المسح - عرض في iframe
  const handleScanSuccess = useCallback((url: string) => {
    console.log('Opening URL:', url);
    const iframe = document.querySelector('iframe[name="iframe_qr"]') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = url;
    }
    setInputValue(url);
  }, []);

  // معالجة أخطاء المسح
  const handleScanError = useCallback((error: string) => {
    console.warn('Scan error:', error);
  }, []);

  // معالجة نتيجة المسح
  const handleScanResult = useCallback((result: string) => {
    if (!isScanningRef.current || scanState.lastScannedCode === result) {
      return;
    }

    setScanState(prev => ({ ...prev, lastScannedCode: result }));

    // التحقق من الرقم المحدد
    if (result === '442069400596830') {
      // إيقاف المسح أولاً
      isScanningRef.current = false;
      if (readerRef.current) {
        try {
          readerRef.current.reset();
          if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        } catch (error) {
          console.warn('Error stopping scanner:', error);
        }
      }
      
      window.open('https://scanned.page/p/82wMbe', '_blank');
      setInputValue(result);
      setCameraActive(false);
      return;
    }

    if (isValidUrl(result)) {
      const finalUrl = result.startsWith('http') ? result : `https://${result}`;
      handleScanSuccess(finalUrl);
    } else {
      // عرض النتيجة في حقل الإدخال
      setInputValue(result);
      const iframe = document.querySelector('iframe[name="iframe_qr"]') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = '';
      }
    }
  }, [scanState.lastScannedCode, isValidUrl, handleScanSuccess]);

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
    
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // بدء المسح عند تحميل المكون
  useEffect(() => {
    if (cameraActive) {
      startScanning();
    }
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  // إيقاف/تشغيل الكاميرا
  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      console.log('Stopping camera...');
      // إيقاف المسح أولاً
      isScanningRef.current = false;
      
      // إيقاف القارئ والفيديو
      if (readerRef.current) {
        try {
          readerRef.current.reset();
          readerRef.current = null;
        } catch (error) {
          console.warn('Error stopping reader:', error);
        }
      }
      
      // إيقاف تدفق الفيديو
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        videoRef.current.srcObject = null;
      }
      
      setCameraActive(false);
      console.log('Camera stopped');
    } else {
      console.log('Starting camera...');
      setCameraActive(true);
    }
  }, [cameraActive]);

  // معالجة قراءة من حقل الإدخال
  const handleManualRead = useCallback(() => {
    if (inputValue.length >= 12) {
      // التحقق من الرقم المحدد
      if (inputValue === '442069400596830') {
        window.open('https://scanned.page/p/82wMbe', '_blank');
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
                <span data-v-d8b7d370="" className="font " style={{fontSize: window.innerWidth <= 768 ? '2.2rem' : '2rem'}}>قراءة رمز الاستجابة السريعة</span>
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
              
              {/* حقل إدخال رمز QR */}
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

export default App
