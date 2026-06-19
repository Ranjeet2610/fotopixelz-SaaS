"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createOrderComment,
  deleteOrderComment,
  listOrderComments,
  listOrderTimeline,
  updateOrderComment,
  type CommentStatus,
  type CommentType,
  type OrderComment,
  type TimelineItem,
} from "@/lib/order-comments-client";
import { useOrderSocket } from "@/lib/use-order-socket";

export function useOrderCommentsQuery(orderId: string, filters?: {
  search?: string;
  commentType?: CommentType;
  status?: CommentStatus;
  assetId?: string;
}) {
  const [items, setItems] = useState<OrderComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listOrderComments(orderId, { limit: 100, ...filters });
      setItems(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [orderId, filters?.search, filters?.commentType, filters?.status, filters?.assetId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useOrderSocket(orderId, {
    onTimelineUpdated: () => void reload(),
  });

  return { items, total, loading, error, reload };
}

export function useOrderTimelineQuery(orderId: string) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listOrderTimeline(orderId);
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useOrderSocket(orderId, {
    onTimelineUpdated: () => void reload(),
  });

  return { items, loading, error, reload };
}

export function useOrderCommentMutations(orderId: string, onSuccess?: () => void) {
  const invalidate = onSuccess ?? (() => undefined);

  return {
    create: async (input: Parameters<typeof createOrderComment>[0]) => {
      const result = await createOrderComment(input);
      invalidate();
      return result;
    },
    update: async (commentId: string, input: Parameters<typeof updateOrderComment>[1]) => {
      const result = await updateOrderComment(commentId, input);
      invalidate();
      return result;
    },
    remove: async (commentId: string) => {
      await deleteOrderComment(commentId);
      invalidate();
    },
  };
}
