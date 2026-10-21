import { defineStore } from "pinia";
import { ref } from "vue";
import { ApiError } from "@/api/http";

export type NoticeColor = "success" | "error" | "info" | "warning";

/** One app-wide snackbar for results of actions (save, delete, RCON...). */
export const useUiStore = defineStore("ui", () => {
  const noticeShown = ref(false);
  const notice = ref("");
  const noticeColor = ref<NoticeColor>("info");

  function notify(message: string, color: NoticeColor = "info") {
    notice.value = message;
    noticeColor.value = color;
    noticeShown.value = true;
  }

  /** Shows an error from an API call (or anything thrown). */
  function notifyError(error: unknown) {
    const message =
      error instanceof ApiError || error instanceof Error ? error.message : String(error);
    notify(message, "error");
  }

  return { noticeShown, notice, noticeColor, notify, notifyError };
});
