"use client";
import { useEffect, useState } from "react";

export type NotificationData = {
  type: string;
  message: string;
};

export function useNotifications() {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");

    ws.onopen = () => console.log("🔌 Conectado WS");
    ws.onclose = () => console.log("❌ Desconectado WS");

    ws.onmessage = (event) => {
      try {
        const data: NotificationData = JSON.parse(event.data);
        setNotification(data);
      } catch (err) {
        console.error("Error parseando WS:", err);
      }
    };

    return () => ws.close();
  }, []);

  return notification;
}