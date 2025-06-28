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
    let checkCount = 0;
    const maxChecks = 20; // Check for 2 seconds
    
    addDebugInfo('Starting Telegram initialization...');
    addDebugInfo(`User Agent: ${navigator.userAgent}`);
    addDebugInfo(`Current URL: ${window.location.href}`);
    addDebugInfo(`Protocol: ${window.location.protocol}`);
    
    const checkTelegram = () => {
      checkCount++;
      addDebugInfo(`Check #${checkCount}: Looking for Telegram...`);
      
      if (typeof window === 'undefined') {
        addDebugInfo('Window is undefined');
        return false;
      }
      
      if (!window.Telegram) {
        addDebugInfo('window.Telegram is not available');
        return false;
      }
      
      if (!window.Telegram.WebApp) {
        addDebugInfo('window.Telegram.WebApp is not available');
        return false;
      }
      
      addDebugInfo('Telegram WebApp found! Initializing...');
      return true;
    };
    
    const initTelegram = () => {
      try {
        if (checkTelegram() && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          addDebugInfo(`Telegram version: ${tg.version || 'unknown'}`);
          addDebugInfo(`Platform: ${tg.platform || 'unknown'}`);
          addDebugInfo(`Color scheme: ${tg.colorScheme || 'unknown'}`);
          addDebugInfo(`Viewport height: ${tg.viewportHeight || 'unknown'}`);
          
          // Check if this is inline mode
          const hasQueryId = !!tg.initDataUnsafe?.query_id;
          setIsInlineMode(hasQueryId);
          addDebugInfo(`Mode: ${hasQueryId ? 'Inline Mode' : 'Regular Mini App'}`);
          
          // Initialize Telegram Web App
          tg.ready();
          addDebugInfo('Telegram ready() called');
          
          if (mounted) {
            setIsReady(true);
            const userName = tg.initDataUnsafe?.user?.first_name || 'Unknown';
            const userId = tg.initDataUnsafe?.user?.id || 'unknown';
            addDebugInfo(`User: ${userName} (ID: ${userId})`);
            addDebugInfo(`Init data: ${tg.initData ? 'present' : 'missing'}`);
            
            // Configure main button
            const mainButton = tg.MainButton;
            mainButton.text = hasQueryId ? 'Share in Chat' : 'Send Message';
            
            // Remove any existing click handlers
            try {
              mainButton.offClick(sendMessage);
            } catch {
              addDebugInfo('Note: offClick not available in this Telegram version');
            }
            
            mainButton.onClick(sendMessage);
            addDebugInfo('Main button configured');
            
            // Show/hide button based on message content
            if (message.trim()) {
              mainButton.show();
              addDebugInfo('Main button shown');
            } else {
              mainButton.hide();
              addDebugInfo('Main button hidden');
            }
          }
        } else {
          if (mounted && checkCount >= maxChecks) {
            const errorMsg = 'Telegram Web App not available after 20 attempts. This app must be opened through a Telegram bot.';
            setError(errorMsg);
            addDebugInfo(errorMsg);
            
            // Check if we're in development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              addDebugInfo('DEVELOPMENT MODE DETECTED: Mini apps only work when deployed with HTTPS');
            }
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMsg = `Initialization error: ${err}`;
          setError(errorMsg);
          addDebugInfo(errorMsg);
        }
      }
    };

    // Immediate check
    if (typeof window !== 'undefined') {
      addDebugInfo('Window is available, checking immediately...');
      if (checkTelegram()) {
        initTelegram();
      } else {
        // Retry every 100ms
        const timer = setInterval(() => {
          if (checkCount >= maxChecks) {
            clearInterval(timer);
            initTelegram(); // Final attempt with error handling
            return;
          }
          
          if (checkTelegram()) {
            clearInterval(timer);
            initTelegram();
          }
        }, 100);
        
        return () => {
          clearInterval(timer);
          mounted = false;
        };
      }
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
      addDebugInfo('Send attempted but Telegram not ready');
      return;
    }
    sendMessage();
  };

  const clearDebug = () => {
    setDebugInfo([]);
    setError('');
  };

  return (
    <div className="w-screen h-screen p-4 bg-white dark:bg-gray-900 overflow-auto">
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-black dark:text-white">
            {isInlineMode ? 'Share Todo Item' : 'Todo List Bot'}
          </h1>
          <button
            onClick={clearDebug}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          >
            Clear Debug
          </button>
        </div>

        {isInlineMode && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900 border border-blue-400 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              🔄 <strong>Inline Mode:</strong> Create your todo item and share it in any chat!
            </p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <textarea
          className="flex-1 w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg outline-none p-4 text-base font-mono bg-white dark:bg-gray-800 text-black dark:text-white focus:border-blue-500 dark:focus:border-blue-400 min-h-24"
          placeholder={
            isInlineMode 
              ? "Type your todo item to share... (Ctrl/Cmd + Enter to share)" 
              : "Type your todo item or message here... (Ctrl/Cmd + Enter to send)"
          }
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(''); // Clear error when typing
          }}
          onKeyDown={handleKeyPress}
          autoFocus
        />
        
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isReady ? '✅ Telegram Ready' : '⏳ Loading...'}
            </span>
            {isReady && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Mode: {isInlineMode ? 'Inline' : 'Regular'}
              </span>
            )}
          </div>
          
          <button
            onClick={testSend}
            disabled={!message.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors"
          >
            {isInlineMode ? 'Share in Chat' : 'Send'}
          </button>
        </div>
        
        {!isReady && (
          <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p><strong>Troubleshooting:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>For Inline Mode: Type <code>@createtodolistbot</code> in any chat</li>
              <li>Make sure you&apos;re opening this through a Telegram bot</li>
              <li>The app must be deployed with HTTPS (not localhost)</li>
              <li>Check if your bot is properly configured with the mini app URL</li>
              <li>Try refreshing the mini app</li>
            </ul>
          </div>
        )}
        
        {debugInfo.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-40 overflow-y-auto">
            <p className="font-semibold mb-2">Debug Log:</p>
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1 font-mono">
                {info}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
