// Shared Types for Barcode Scanner Components

export interface ScanState {
  status: 'loading' | 'scanning' | 'success' | 'error' | 'permission-denied';
  message: string;
  lastScannedCode?: string;
}

export interface BarcodeScannerProps {
  onScanSuccess: (url: string) => void;
  onScanError: (error: string) => void;
}

export interface HeaderProps {
  title: string;
  subtitle: string;
}

export interface CameraFrameProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
}

export interface StatusOverlayProps {
  status: ScanState['status'];
  message: string;
}

export interface StatusMessageProps {
  status: ScanState['status'];
  message: string;
  onRetry?: () => void;
}

export interface UseBarcodeScanner {
  onScanSuccess: (url: string) => void;
  onScanError: (error: string) => void;
}