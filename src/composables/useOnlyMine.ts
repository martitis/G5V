import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * The "Only mine" toggle of a list page (replaces the old "My …" pages). Starts from `?mine=1` (the old
 * /myteams etc. redirect there), else from what this browser chose last time; changes are remembered and kept in
 * the URL, so the view can be bookmarked.
 * @param list - storage key per list, e.g. "teams"
 */
export function useOnlyMine(list: string) {
  const route = useRoute();
  const router = useRouter();
  const storageKey = `onlyMine.${list}`;
  const stored = (() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  })();
  const fromQuery = route.query.mine;
  const mine = ref(fromQuery === "1" ? true : fromQuery === "0" ? false : stored);
  watch(mine, (value) => {
    try {
      localStorage.setItem(storageKey, value ? "1" : "0");
    } catch {
      // Private mode: the toggle just isn't remembered.
    }
    void router.replace({ query: { ...route.query, mine: value ? "1" : undefined } });
  });
  return mine;
}
