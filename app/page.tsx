"use client";

import { useEffect, useState } from "react";
import { decodeStartParam } from "@/lib/startParams";
import MessageEditor from "./components/MessageEditor";

export default function Home() {
  const [text, setText] = useState("");
  const [inlineMessageId, setInlineMessageId] = useState<string | null>(null);
  console.log("inlineMessageId", inlineMessageId);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram) {
      const tg = window.Telegram.WebApp;
      tg.ready();

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
    />
  );
}
