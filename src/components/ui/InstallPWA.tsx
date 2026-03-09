'use client';

import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showiOSModal, setShowiOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone/PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Robust iOS detection: iPhone, iPad, iPod, or iPadOS (Macintosh + touch)
    const ua = window.navigator.userAgent;
    const iosDevice =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.maxTouchPoints > 1 && /macintosh/i.test(ua));
    setIsIOS(iosDevice);

    // Android/Chrome install prompt
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowiOSModal(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // Hide if already installed
  if (isStandalone) return null;
  // Show on iOS always (for manual add), or on Android if prompt is available
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-all border border-blue-100 mt-1 group"
      >
        <Download className="w-5 h-5 shrink-0" />
        <span>Install App</span>
      </button>

      {/* iOS Manual Install Modal */}
      {showiOSModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
              <button
                onClick={() => setShowiOSModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <Smartphone className="w-10 h-10 mb-3 opacity-80" />
              <h3 className="text-xl font-bold">Install DDA Portal</h3>
              <p className="text-blue-100 text-sm mt-1">Add to your iPhone Home Screen for the best experience</p>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    Tap the <Share className="w-4 h-4 text-blue-600 inline" /> <strong className="text-blue-600">Share</strong> button
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">In the bottom toolbar of Safari</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    Tap <PlusSquare className="w-4 h-4 text-blue-600 inline" /> <strong className="text-blue-600">"Add to Home Screen"</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">Scroll down in the share menu to find it</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <p className="font-semibold text-gray-800">Tap <strong className="text-blue-600">"Add"</strong> in the top right</p>
                  <p className="text-sm text-gray-500 mt-0.5">The app icon will appear on your Home Screen</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 mb-4">
                ⚠️ Make sure you are using <strong>Safari</strong> browser, not Chrome, for this to work on iPhone.
              </div>
              <button
                onClick={() => setShowiOSModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors shadow-lg"
              >
                Got it! 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
