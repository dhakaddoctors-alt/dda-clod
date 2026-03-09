'use client';

import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showiOSModal, setShowiOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(!!checkStandalone);

    // Detect iOS and Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Check for Safari (excluding Chrome/Edge on iOS)
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    // iPadOS 13+ reports as Macintosh but has touch points
    const isIPadOS = navigator.maxTouchPoints > 0 && /macintosh/.test(userAgent);
    
    setIsIOS(isIOSDevice || isIPadOS || isSafari);

    // Handle Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowiOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // On Safari/iOS, we always want to show the manual install button if not standalone
  // On other browsers, we show it only if deferredPrompt is available
  if (isStandalone) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-all border border-blue-100 mt-4 group"
      >
        <Download className="w-5 h-5 group-hover:bounce" />
        <span>Install App</span>
      </button>

      {/* iOS Instruction Modal */}
      {showiOSModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Install DDA Portal</h3>
              <button onClick={() => setShowiOSModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Install this app on your iPhone for a better experience:</p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Share className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Tap the <span className="font-bold underline text-blue-600">Share</span> icon in Safari.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <PlusSquare className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select <span className="font-bold underline text-blue-600">"Add to Home Screen"</span> from the menu.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowiOSModal(false)}
              className="w-full mt-8 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
