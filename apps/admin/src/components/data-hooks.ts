"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { asList } from "@/lib/format";
import type { ApiList, ApiRecord } from "@/lib/types";

export function useApiList<T = ApiRecord>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
) {
  const [data, setData] = useState<ApiList<T>>({ items: [], total: 0 });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const queryKey = useMemo(() => JSON.stringify(query ?? {}), [query]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest(path, { query });
        if (!cancelled) {
          setData(asList<T>(result));
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [path, queryKey, revision, enabled]);

  return { data, loading, error, reload };
}

export function useApiResource<T = ApiRecord>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const activePath = path;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<T>(activePath);
        if (!cancelled) {
          setData(result);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [path, revision]);

  return { data, loading, error, reload };
}
