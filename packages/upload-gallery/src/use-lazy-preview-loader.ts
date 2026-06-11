'use client'

import { useEffect, useRef, useState } from 'react'

type UseLazyPreviewLoaderOptions = {
  enabled: boolean
  load: () => Promise<string>
}

export function useLazyPreviewLoader({ enabled, load }: UseLazyPreviewLoaderOptions) {
  const rootRef = useRef<HTMLDivElement>(null)
  const loadRef = useRef(load)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  loadRef.current = load

  useEffect(() => {
    if (!enabled) {
      setPreviewUrl((current) => (current === null ? current : null))
      setLoading((current) => (current ? false : current))
      setError((current) => (current ? false : current))
      return
    }

    const element = rootRef.current
    if (!element) {
      return
    }

    let cancelled = false
    let started = false

    const runLoad = () => {
      if (cancelled || started) {
        return
      }

      started = true
      setLoading((current) => (current ? current : true))
      setError((current) => (current ? false : current))

      void loadRef
        .current()
        .then((url) => {
          if (!cancelled) {
            setPreviewUrl((current) => (current === url ? current : url))
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError((current) => (current ? current : true))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading((current) => (current ? false : current))
          }
        })
    }

    const isVisible = () => {
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight + 120
    }

    if (isVisible()) {
      runLoad()
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !cancelled && !started) {
            observer.disconnect()
            runLoad()
          }
        },
        { rootMargin: '160px' }
      )

      observer.observe(element)

      const fallbackTimer = window.setTimeout(() => {
        if (!started && !cancelled && isVisible()) {
          observer.disconnect()
          runLoad()
        }
      }, 250)

      return () => {
        cancelled = true
        observer.disconnect()
        window.clearTimeout(fallbackTimer)
      }
    }

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { rootRef, previewUrl, loading, error }
}
