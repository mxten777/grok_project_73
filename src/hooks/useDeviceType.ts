import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // Initial check
    const initialCheck = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');

      if (width < 768) {
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width >= 768 && width < 1024) {
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    initialCheck();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');

      if (width < 768) {
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width >= 768 && width < 1024) {
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setScreenSize({ width, height });
        setOrientation(height > width ? 'portrait' : 'landscape');

        if (width < 768) {
          setIsMobile(true);
          setIsTablet(false);
          setIsDesktop(false);
        } else if (width >= 768 && width < 1024) {
          setIsMobile(false);
          setIsTablet(true);
          setIsDesktop(false);
        } else {
          setIsMobile(false);
          setIsTablet(false);
          setIsDesktop(true);
        }
      }, 100); // Delay to ensure dimensions are updated
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    orientation,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
};