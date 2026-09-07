import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    // We create a new Html5QrcodeScanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        try {
          // Expecting URL like: http://localhost:5173/join-room?code=XXXXXX
          const url = new URL(decodedText);
          const code = url.searchParams.get('code');
          
          if (code && code.length === 6 && /^[A-Z0-9]+$/i.test(code)) {
            // Valid code found
            scanner.clear().catch(console.error);
            onScanSuccessRef.current(code.toUpperCase());
          } else {
            setError('Invalid SPIRE DECK DUEL room QR.');
          }
        } catch (e) {
          setError('Invalid QR code format.');
        }
      },
      (_errorMessage) => {
        // Ignore regular scan failures as they happen continuously until a QR is found
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 flex flex-col bg-slate-950"
      >
        <header className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-900">
          <div className="font-serif font-bold tracking-widest text-emerald-400">SCAN ROOM QR</div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {error && (
            <div className="absolute top-6 left-6 right-6 text-red-400 text-sm font-medium text-center bg-red-900/40 p-3 rounded-lg border border-red-900/50 z-10 backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-black border border-emerald-500/30">
            <div id="qr-reader" className="w-full h-full min-h-[300px]"></div>
          </div>
          
          <p className="mt-8 text-slate-400 text-sm text-center">
            Position the QR code inside the frame.
          </p>

          <button 
            onClick={onClose}
            className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            <CameraOff className="w-5 h-5" />
            Enter Code Manually
          </button>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
