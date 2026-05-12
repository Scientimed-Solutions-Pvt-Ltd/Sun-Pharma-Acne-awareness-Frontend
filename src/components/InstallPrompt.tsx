import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');

    // Check if user has dismissed the prompt before
    const hasUserDismissedPrompt = localStorage.getItem('installPromptDismissed') === 'true';

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detect mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    setIsIOS(iOS);
    setIsMobile(mobile);

    // Only show prompt if not installed, not dismissed, and on mobile
    if (!isStandalone && !hasUserDismissedPrompt && mobile) {
      // For iOS Safari, show custom prompt after a short delay
      if (iOS) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2000); // Show after 2 seconds
        return () => clearTimeout(timer);
      }
    }

    // For Chrome/Android - listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      if (!hasUserDismissedPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // For iOS - show modal with instructions
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // For Chrome/Android - trigger native install
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', 'true');
    setShowPrompt(false);
    setShowIOSModal(false);
  };

  if (!showPrompt || !isMobile) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg animate-slide-up">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img src="/icon.png" alt="App icon" className="w-14 h-14 rounded-xl shadow-lg border-2 border-white" />
            </div>
            
            <div className="flex-1 text-white">
              <h3 className="font-bold text-lg mb-0.5">
                Install Yellow March App
              </h3>
              <p className="text-sm text-purple-100">
                Quick access from your home screen
              </p>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-purple-200 hover:text-white p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-purple-700 px-6 py-3 rounded-lg font-bold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-md"
            >
              {isIOS ? '📱 Add to Home Screen' : '⬇️ Install Now'}
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <img src="/icon.png" alt="App icon" className="w-12 h-12 rounded-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Add to Home Screen
              </h3>
              <p className="text-sm text-gray-600">
                Follow these quick steps:
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-800">
                    Tap the <strong>Share</strong> button{' '}
                    <svg className="inline w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-800">
                    Scroll and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-800">
                    Tap <strong>"Add"</strong> to confirm
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;
