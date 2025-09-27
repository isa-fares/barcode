import { useCallback } from 'react';
import BarcodeScanner from './components/BarcodeScanner';

function App() {
  // معالجة نجاح المسح - إعادة التوجيه الفوري
  const handleScanSuccess = useCallback((url: string) => {
    console.log('Redirecting to:', url);
    // إعادة التوجيه الفوري للرابط
    window.location.href = url;
  }, []);

  // معالجة أخطاء المسح
  const handleScanError = useCallback((error: string) => {
    console.warn('Scan error:', error);
    // يمكن إضافة تتبع للأخطاء هنا إذا لزم الأمر
  }, []);

  return (
    <div className="min-h-screen" dir="rtl">
      <BarcodeScanner 
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  );
}

export default App
