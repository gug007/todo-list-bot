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
    alert('sendMessage function called');
    alert(`Message: "${message.trim()}"`);
    alert(`Message length: ${message.trim().length}`);
    alert(`window.Telegram exists: ${!!window.Telegram}`);
    alert(`window.Telegram.WebApp exists: ${!!window.Telegram?.WebApp}`);
    
    if (message.trim() && window.Telegram?.WebApp) {
      alert('About to call Telegram WebApp sendData');
      try {
        window.Telegram.WebApp.sendData(message.trim());
        alert('Successfully called sendData');
      } catch (error) {
        alert(`Error calling sendData: ${error}`);
      }
    } else {
      if (!message.trim()) {
        alert('Message is empty or whitespace only');
      }
      if (!window.Telegram?.WebApp) {
        alert('Telegram WebApp not available');
      }
    }
  }, [message]);

  useEffect(() => {
    alert('useEffect running');
    alert(`typeof window: ${typeof window}`);
    alert(`window !== undefined: ${typeof window !== 'undefined'}`);
    alert(`window.Telegram exists: ${!!window.Telegram}`);
    alert(`window.Telegram?.WebApp exists: ${!!window.Telegram?.WebApp}`);
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      alert('Initializing Telegram WebApp');
      try {
        window.Telegram.WebApp.ready();
        alert('Telegram WebApp ready() called successfully');
        setIsReady(true);
        alert('isReady set to true');
        
        // Configure main button
        const mainButton = window.Telegram.WebApp.MainButton;
        alert('Got MainButton reference');
        mainButton.text = 'Send Message';
        alert('Set MainButton text');
        
        mainButton.onClick(() => {
          alert('MainButton clicked!');
          sendMessage();
        });
        alert('Set MainButton onClick handler');
        
        if (message.trim()) {
          mainButton.show();
          alert('MainButton shown');
        } else {
          mainButton.hide();
          alert('MainButton hidden');
        }
      } catch (error) {
        alert(`Error in Telegram WebApp setup: ${error}`);
      }
    } else {
      alert('Telegram WebApp not available in useEffect');
    }
  }, [message, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    alert(`Key pressed: ${e.key}, metaKey: ${e.metaKey}, ctrlKey: ${e.ctrlKey}`);
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      alert('Ctrl/Cmd + Enter detected, calling sendMessage');
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
            onClick={() => {
              alert('Send button clicked!');
              sendMessage();
            }}
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
