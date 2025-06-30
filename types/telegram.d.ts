// types/telegram.d.ts

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: any; // You can define a more specific type for user
    auth_date: number;
    hash: string;
    inline_message_id?: string;
    start_param?: string;
  };
  ready: () => void;
  close: () => void;
  expand: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  enableVerticalSwipes: () => void;
  disableVerticalSwipes: () => void;
  isVersionAtLeast: (version: string) => boolean;
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
} 