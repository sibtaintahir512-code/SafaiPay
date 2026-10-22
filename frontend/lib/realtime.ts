import { EventEmitter } from 'events';

export interface RealtimeEvent {
  id: string;
  type: 
    | 'job_created' 
    | 'job_updated' 
    | 'job_accepted' 
    | 'pickup_started' 
    | 'photo_uploaded' 
    | 'weight_verified' 
    | 'delivered_to_recycler' 
    | 'recycler_processing' 
    | 'job_completed' 
    | 'job_cancelled' 
    | 'notification'
    | 'chat_message'
    | 'chat_message_update'
    | 'chat_message_delete'
    | 'chat_reaction'
    | 'chat_read_receipt'
    | 'chat_typing'
    | 'chat_presence'
    | 'chat_conversation_new';
  job_id?: string;
  target_user_id?: string;
  target_role?: string;
  timestamp: string;
  payload: any;
}

// Global EventEmitter singleton across Next.js API route invocations
const globalRealtime = global as unknown as {
  __safaipay_realtime_emitter__?: EventEmitter;
  __safaipay_recent_events__?: RealtimeEvent[];
};

if (!globalRealtime.__safaipay_realtime_emitter__) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(200);
  globalRealtime.__safaipay_realtime_emitter__ = emitter;
  globalRealtime.__safaipay_recent_events__ = [];
}

const emitter = globalRealtime.__safaipay_realtime_emitter__;
const recentEvents = globalRealtime.__safaipay_recent_events__!;

export function broadcastEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): RealtimeEvent {
  const fullEvent: RealtimeEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Keep last 100 events in memory for catch-up polling
  recentEvents.push(fullEvent);
  if (recentEvents.length > 100) {
    recentEvents.shift();
  }

  emitter.emit('event', fullEvent);
  return fullEvent;
}

export function subscribeToRealtime(listener: (event: RealtimeEvent) => void): () => void {
  emitter.on('event', listener);
  return () => {
    emitter.off('event', listener);
  };
}

export function getEventsSince(sinceIsoTimestamp?: string, filter?: { role?: string; userId?: string }): RealtimeEvent[] {
  let events = recentEvents;
  if (sinceIsoTimestamp) {
    const sinceTime = new Date(sinceIsoTimestamp).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
  }
  if (filter?.userId) {
    events = events.filter((e) => !e.target_user_id || e.target_user_id === filter.userId);
  }
  if (filter?.role) {
    events = events.filter((e) => !e.target_role || e.target_role === 'all' || e.target_role === filter.role);
  }
  return events;
}
