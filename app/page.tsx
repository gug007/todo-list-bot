'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        sendData: (data: string) => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);

  const sendMessage = useCallback(() => {
    if (message.trim() && window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(message.trim());
    }
  }, [message]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      setIsReady(true);
      
      // Configure main button
      const mainButton = window.Telegram.WebApp.MainButton;
      mainButton.text = 'Send Message';
      mainButton.onClick(() => sendMessage());
      
      if (message.trim()) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
    }
  }, [message, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      sendMessage();
    }
  };

  return (
    <div className="w-screen h-screen p-4 bg-white dark:bg-gray-900">
      <div className="h-full flex flex-col gap-4">
        <h1 className="text-xl font-bold text-black dark:text-white">
          Send Message
        </h1>
        
        <textarea
          className="flex-1 w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg outline-none p-4 text-base font-mono bg-white dark:bg-gray-800 text-black dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
          placeholder="Type your message here... (Ctrl/Cmd + Enter to send)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          autoFocus
        />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isReady ? '✓ Telegram Ready' : '⏳ Loading...'}
          </span>
          
          <button
            onClick={sendMessage}
            disabled={!message.trim() || !isReady}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
