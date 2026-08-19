"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, getStoredToken } from "./api-client";

const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

type OrderSocketHandlers = {
  onCommentCreated?: (payload: unknown) => void;
  onCommentUpdated?: (payload: unknown) => void;
  onCommentDeleted?: (payload: unknown) => void;
  onCommentResolved?: (payload: unknown) => void;
  onTimelineUpdated?: (payload: unknown) => void;
};

export function useOrderSocket(orderId: string | null, handlers: OrderSocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      return;
    }

    const socket: Socket = io(SOCKET_ORIGIN, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.emit("order.join", orderId);

    const refresh = () => {
      handlersRef.current.onTimelineUpdated?.({ orderId });
    };

    socket.on("comment.created", (payload) => {
      handlersRef.current.onCommentCreated?.(payload);
      refresh();
    });
    socket.on("comment.updated", (payload) => {
      handlersRef.current.onCommentUpdated?.(payload);
      refresh();
    });
    socket.on("comment.deleted", (payload) => {
      handlersRef.current.onCommentDeleted?.(payload);
      refresh();
    });
    socket.on("comment.resolved", (payload) => {
      handlersRef.current.onCommentResolved?.(payload);
      refresh();
    });
    socket.on("timeline.updated", refresh);

    return () => {
      socket.emit("order.leave", orderId);
      socket.disconnect();
    };
  }, [orderId]);
}
