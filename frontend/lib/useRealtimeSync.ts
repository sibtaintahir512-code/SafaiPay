'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeEvent } from './realtime';

interface UseRealtimeSyncOptions {
  role?: string;
  userId?: string;
  onEvent?: (event: RealtimeEvent) => void;
  onRefresh?: () => void;
  enabled?: boolean;
}

export function useRealtimeSync({
  role = 'all',
  userId,
  onEvent,
  onRefresh,
  enabled = true,
}: UseRealtimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastTimestampRef = useRef<string>(new Date().toISOString());
  const onRefreshRef = useRef(onRefresh);
  const onEventRef = useRef(onEvent);

  onRefreshRef.current = onRefresh;
  onEventRef.current = onEvent;

  const triggerRefresh = useCallback(() => {
    if (onRefreshRef.current) {
      onRefreshRef.current();
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connectSSE() {
      try {
        const query = new URLSearchParams();
        if (role) query.set('role', role);
        if (userId) query.set('userId', userId);

        const url = `/api/v1/realtime/stream?${query.toString()}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isMounted) setIsConnected(true);
        };

        es.onerror = () => {
          if (isMounted) setIsConnected(false);
          es.close();
          // Attempt reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            if (isMounted) connectSSE();
          }, 3000);
        };

        // Listen for all event types
        const eventTypes = [
          'job_created',
          'job_updated',
          'job_accepted',
          'pickup_started',
          'photo_uploaded',
          'weight_verified',
          'delivered_to_recycler',
          'recycler_processing',
          'job_completed',
          'job_cancelled',
          'notification',
        ];

        eventTypes.forEach((type) => {
          es.addEventListener(type, (e: MessageEvent) => {
            try {
              const data = JSON.parse(e.data) as RealtimeEvent;
              lastTimestampRef.current = data.timestamp || new Date().toISOString();
              if (onEventRef.current) {
                onEventRef.current(data);
              }
              triggerRefresh();
            } catch {}
          });
        });
      } catch (err) {
        // Fallback gracefully
      }
    }

    // Safety net fallback polling every 4 seconds to catch any dropped serverless events
    async function pollUpdates() {
      try {
        const query = new URLSearchParams();
        if (lastTimestampRef.current) query.set('since', lastTimestampRef.current);
        if (role) query.set('role', role);
        if (userId) query.set('userId', userId);

        const res = await fetch(`/api/v1/realtime/poll?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) {
            lastTimestampRef.current = data.timestamp;
            data.events.forEach((evt: RealtimeEvent) => {
              if (onEventRef.current) {
                onEventRef.current(evt);
              }
            });
            triggerRefresh();
          }
        }
      } catch {}
    }

    connectSSE();
    pollInterval = setInterval(pollUpdates, 4000);

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollInterval) clearInterval(pollInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [enabled, role, userId, triggerRefresh]);

  return { isConnected };
}
