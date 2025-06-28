'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        sendData: (data: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            first_name?: string;
            last_name?: string;
            username?: string;
            id?: number;
          };
          chat?: object;
          auth_date?: number;
          query_id?: string;
        };
        version: string;
        platform: string;
        colorScheme: string;
        themeParams: object;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        expand: () => void;
      };
    };
  }
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isInlineMode, setIsInlineMode] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Force immediate ready call when Telegram is detected
  useEffect(() => {
    const forceReady = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.ready();
          addDebugInfo('EMERGENCY: Immediate ready() called');
        } catch (e) {
          addDebugInfo(`EMERGENCY: Ready failed: ${e}`);
        }
      }
    };

    // Call immediately
    forceReady();
    
    // Also call after a tiny delay
    const timer = setTimeout(forceReady, 10);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = useCallback(() => {
    if (message.trim() && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        
        if (isInlineMode) {
          // For inline mode, use switchInlineQuery
          tg.switchInlineQuery(message.trim(), ['users', 'groups', 'channels']);
          addDebugInfo('Inline query sent successfully');
        } else {
          // For regular mini apps, use sendData
          tg.sendData(message.trim());
          addDebugInfo('Message sent successfully');
        }
        
        setMessage(''); // Clear message after sending
      } catch (err) {
        const errorMsg = `Failed to send: ${err}`;
        setError(errorMsg);
        addDebugInfo(errorMsg);
      }
    }
  }, [message, isInlineMode]);

  useEffect(() => {
    let mounted = true;
    
    addDebugInfo('=== INITIALIZATION START ===');
    addDebugInfo(`User Agent: ${navigator.userAgent}`);
    addDebugInfo(`Current URL: ${window.location.href}`);
    addDebugInfo(`Protocol: ${window.location.protocol}`);
    addDebugInfo(`Host: ${window.location.host}`);
    
    const initTelegram = () => {
      try {
        addDebugInfo('Checking for Telegram...');
        
        if (typeof window === 'undefined') {
          addDebugInfo('❌ Window undefined');
          return;
        }
        
        if (!window.Telegram) {
          addDebugInfo('❌ window.Telegram not found');
          return;
        }
        
        if (!window.Telegram.WebApp) {
          addDebugInfo('❌ window.Telegram.WebApp not found');
          return;
        }
        
        const tg = window.Telegram.WebApp;
        addDebugInfo('✅ Telegram WebApp found!');
        
        // CRITICAL: Call ready() immediately
        tg.ready();
        addDebugInfo('✅ ready() called immediately');
        
        // Expand the app
        try {
          tg.expand();
          addDebugInfo('✅ expand() called');
        } catch {
          addDebugInfo('⚠️ expand() not available');
        }
        
        if (!mounted) return;
        
        // Get basic info
        addDebugInfo(`Version: ${tg.version || 'unknown'}`);
        addDebugInfo(`Platform: ${tg.platform || 'unknown'}`);
        addDebugInfo(`Color scheme: ${tg.colorScheme || 'unknown'}`);
        addDebugInfo(`Viewport: ${tg.viewportHeight || 'unknown'}px`);
        
        // Check mode
        const hasQueryId = !!tg.initDataUnsafe?.query_id;
        setIsInlineMode(hasQueryId);
        addDebugInfo(`Mode: ${hasQueryId ? '🔄 INLINE' : '📱 REGULAR'}`);
        
        setIsReady(true);
        addDebugInfo('✅ APP READY!');
        
        // User info
        const userName = tg.initDataUnsafe?.user?.first_name || 'Unknown';
        const userId = tg.initDataUnsafe?.user?.id || 'unknown';
        addDebugInfo(`User: ${userName} (${userId})`);
        
        // Setup main button
        const mainButton = tg.MainButton;
        mainButton.text = hasQueryId ? 'Share in Chat' : 'Send Message';
        
        try {
          mainButton.offClick(sendMessage);
        } catch {
          // Ignore if not available
        }
        
        mainButton.onClick(sendMessage);
        
        if (message.trim()) {
          mainButton.show();
        } else {
          mainButton.hide();
        }
        
        addDebugInfo('✅ Main button configured');
        
      } catch (err) {
        if (mounted) {
          const errorMsg = `❌ Init error: ${err}`;
          setError(errorMsg);
          addDebugInfo(errorMsg);
        }
      }
    };

    // Multiple initialization attempts
    if (typeof window !== 'undefined') {
      // Immediate attempt
      initTelegram();
      
      // Fallback attempts
      const timers = [50, 100, 200, 500].map(delay => 
        setTimeout(initTelegram, delay)
      );
      
      return () => {
        mounted = false;
        timers.forEach(clearTimeout);
      };
    }

    return () => {
      mounted = false;
    };
  }, [message, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      sendMessage();
    }
  };

  const testSend = () => {
    if (!isReady) {
      setError('Telegram not ready yet');
      addDebugInfo('❌ Send attempted but not ready');
      return;
    }
    sendMessage();
  };

  const clearDebug = () => {
    setDebugInfo([]);
    setError('');
  };

  const forceInit = () => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        addDebugInfo('🔧 MANUAL ready() called');
        setIsReady(true);
      } catch (e) {
        addDebugInfo(`🔧 MANUAL ready() failed: ${e}`);
      }
    }
  };

  return (
    <div className="w-screen h-screen p-4 bg-white dark:bg-gray-900 overflow-auto">
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-black dark:text-white">
            {isInlineMode ? '🔄 Share Todo' : '📱 Todo Bot'}
          </h1>
          <div className="flex gap-2">
            {!isReady && (
              <button
                onClick={forceInit}
                className="text-xs px-2 py-1 bg-green-200 dark:bg-green-700 rounded text-green-600 dark:text-green-300"
              >
                Force Init
              </button>
            )}
            <button
              onClick={clearDebug}
              className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-lg ${isReady ? 'text-green-500' : 'text-orange-500'}`}>
            {isReady ? '✅ Ready' : '⏳ Loading...'}
          </span>
          {isReady && (
            <span className="text-sm text-gray-500">
              {isInlineMode ? '🔄 Inline' : '📱 Regular'}
            </span>
          )}
        </div>

        {isInlineMode && isReady && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900 border border-blue-400 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              🔄 <strong>Inline Mode Active:</strong> Create your todo and share it!
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <textarea
          className="flex-1 w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg outline-none p-4 text-base bg-white dark:bg-gray-800 text-black dark:text-white focus:border-blue-500 dark:focus:border-blue-400 min-h-32"
          placeholder={
            isInlineMode 
              ? "✍️ Type your todo item to share..." 
              : "✍️ Type your todo item..."
          }
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyPress}
          autoFocus
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {message.length} characters
          </div>
          
          <button
            onClick={testSend}
            disabled={!message.trim() || !isReady}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors"
          >
            {isInlineMode ? '🔄 Share' : '📤 Send'}
          </button>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-40 overflow-y-auto">
          <p className="font-semibold mb-2">🔍 Debug Log:</p>
          {debugInfo.length === 0 ? (
            <div>Waiting for initialization...</div>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="mb-1 font-mono text-xs">
                {info}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
