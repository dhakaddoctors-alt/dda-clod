'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface DynamicUPIQRProps {
  upiId: string;
  name: string;
  amount?: string;
  note?: string;
  className?: string;
}

export default function DynamicUPIQR({ upiId, name, amount, note, className }: DynamicUPIQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // UPI Link Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTES
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}${amount ? `&am=${encodeURIComponent(amount)}` : ''}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ''}`;

    QRCode.toCanvas(canvasRef.current, upiLink, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }, (error) => {
      if (error) console.error('Error generating QR code:', error);
    });
  }, [upiId, name, amount, note]);

  return (
    <div className={`flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-gray-200 ${className}`}>
      <canvas ref={canvasRef} className="max-w-full h-auto" />
      <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase tracking-widest">Scan to Pay via UPI</p>
    </div>
  );
}
