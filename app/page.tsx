"use client";

import { useEffect, useState } from "react";
import { decodeStartParam } from "@/lib/startParams";
import MessageEditor from "./components/MessageEditor";

export default function Home() {
  const [text, setText] = useState("");
  const [inlineMessageId, setInlineMessageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  console.log("inlineMessageId", inlineMessageId);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      // Configure the mini app for better drag and drop experience
      if (tg.isVersionAtLeast && tg.isVersionAtLeast("6.2")) {
        // Enable closing confirmation to prevent accidental closure
        if (tg.enableClosingConfirmation) {
          tg.enableClosingConfirmation();
        }
      }

      // Expand to full height for better drag experience
      if (tg.expand) {
        tg.expand();
      }

      const params = new URLSearchParams(window.location.search);

      console.log("search", window.location.search);
      const initialText = params.get("text");
      const startParam = params.get("tgWebAppStartParam") || params.get("id");

      if (initialText) setText(initialText);

      if (startParam) {
        try {
          const data = decodeStartParam<{ id?: string; q?: string }>(
            startParam
          );
          if (data.id) setInlineMessageId(data.id);
          if (data.q && !initialText) setText(data.q);
        } catch (err) {
          console.error("Failed to decode start param", err);
        }
      }

      const initStr = tg.initData || "";
      if (initStr) {
        const initSearch = new URLSearchParams(initStr);
        const imid = initSearch.get("inline_message_id");
        if (imid) setInlineMessageId(imid);
      }
    }
  }, []);

  // Handle drag state changes to control mini app behavior
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram) {
      const tg = window.Telegram.WebApp;
      
      if (isDragging) {
        // Disable vertical swipes during drag to prevent mini app from closing
        if (tg.disableVerticalSwipes && tg.isVersionAtLeast && tg.isVersionAtLeast("7.7")) {
          tg.disableVerticalSwipes();
        }
      } else {
        // Re-enable vertical swipes when not dragging
        if (tg.enableVerticalSwipes && tg.isVersionAtLeast && tg.isVersionAtLeast("7.7")) {
          tg.enableVerticalSwipes();
        }
      }
    }
  }, [isDragging]);

  const handleSubmit = async () => {
    if (!inlineMessageId) {
      alert("No identifiers to update message");
      return;
    }

    const endpoint = "/api/edit-message";
    const payload = { inline_message_id: inlineMessageId, text };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.Telegram.WebApp.close();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <MessageEditor
      text={text}
      setText={setText}
      onSubmit={handleSubmit}
      disabled={!text || !inlineMessageId}
      onDragStateChange={setIsDragging}
    />
  );
}
