import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan) => {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing inside standard text areas or inputs that aren't the barcode target
      const target = e.target;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' && target.dataset?.barcodeInput !== 'true'))
      ) {
        return;
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          onScan(bufferRef.current.trim());
        }
        bufferRef.current = '';
        return;
      }

      // If time between keystrokes is too large (>250ms), reset buffer
      if (diff > 250) {
        bufferRef.current = '';
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan]);
};

export default useBarcodeScanner;
