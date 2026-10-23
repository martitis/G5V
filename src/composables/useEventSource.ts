import { onBeforeUnmount, ref } from "vue";
import { apiUrl } from "@/config";

/**
 * Server-sent events from the API (live match data). The browser reconnects by itself after a dropped
 * connection; the stream is closed when the component unmounts.
 * @param path API path, e.g. "/matches/12/stream"
 * @param events event name -> handler; data is parsed as JSON
 */
export function useEventSource(path: string, events: Record<string, (data: any) => void>) {
  const connected = ref(false);
  const source = new EventSource(apiUrl(path), { withCredentials: true });

  source.onopen = () => (connected.value = true);
  source.onerror = () => (connected.value = false);
  for (const [name, handler] of Object.entries(events)) {
    source.addEventListener(name, (event) => {
      try {
        handler(JSON.parse((event as MessageEvent).data));
      } catch (error) {
        console.error(`Bad "${name}" event from ${path}:`, error);
      }
    });
  }

  function close() {
    source.close();
    connected.value = false;
  }
  onBeforeUnmount(close);

  return { connected, close };
}
