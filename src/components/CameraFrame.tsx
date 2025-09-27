import React from 'react';

interface CameraFrameProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
}

const CameraFrame: React.FC<CameraFrameProps> = ({ videoRef, isScanning }) => {
  return (
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
            {isScanning && (
              <div className="absolute inset-x-0 top-0 h-1 md:h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent scan-line"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFrame;