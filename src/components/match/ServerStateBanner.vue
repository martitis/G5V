<template>
  <template v-if="problem">
    <v-alert
      :type="state!.state === 'interrupted' ? 'error' : 'warning'"
      variant="tonal"
      :prominent="state!.state === 'interrupted'"
      :icon="state!.state === 'interrupted' ? 'mdi-server-remove' : 'mdi-server-network-off'"
      class="mb-4"
    >
      <div class="font-weight-medium">
        {{
          state!.state === "interrupted" ? $t("ServerState.Interrupted") : $t("ServerState.Offline")
        }}
      </div>
      <div class="text-body-medium">
        {{ state!.reason }}
        <span v-if="lastSeen != null"> · {{ $t("ServerState.LastSeen", { n: lastSeen }) }}</span>
      </div>
      <div v-if="!admin" class="text-body-small mt-1">{{ $t("ServerState.AdminsNotified") }}</div>

      <div v-if="admin" class="d-flex flex-wrap ga-2 mt-3">
        <template v-if="state!.state === 'interrupted'">
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-backup-restore"
            @click="emit('action', 'restore')"
          >
            {{ $t("ServerState.Restore") }}
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-upload"
            :loading="busy === 'reload'"
            @click="confirmReload = true"
          >
            {{ $t("ServerState.Reload") }}
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-restart"
            @click="emit('action', 'restart')"
          >
            {{ $t("ServerState.Restart") }}
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-flag-checkered"
            @click="emit('action', 'forfeit')"
          >
            {{ $t("ServerState.EndWithWinner") }}
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            color="error"
            prepend-icon="mdi-cancel"
            @click="emit('action', 'cancel')"
          >
            {{ $t("ServerState.Cancel") }}
          </v-btn>
        </template>
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-refresh"
          :loading="busy === 'check'"
          @click="check"
        >
          {{ $t("ServerState.CheckNow") }}
        </v-btn>
        <v-btn size="small" variant="text" :loading="busy === 'dismiss'" @click="dismiss">
          {{ $t("ServerState.Dismiss") }}
        </v-btn>
      </div>
    </v-alert>

    <v-dialog v-model="confirmReload" max-width="460">
      <v-card :title="$t('ServerState.Reload')" :text="$t('ServerState.ReloadConfirm')">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmReload = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="primary" @click="reload">{{ $t("misc.Confirm") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { matches } from "@/api";
import type { Match, ServerState } from "@/api/types";
import { useUiStore } from "@/stores/ui";

/**
 * The API's heartbeat for a running match: a warning when the game server stops answering, and when it was
 * restarted or has another match loaded, with the ways to recover (owner/admin). Refreshed every 20 s.
 */
const props = defineProps<{ match: Match; admin: boolean }>();
const emit = defineEmits<{
  action: [action: "restore" | "restart" | "forfeit" | "cancel"];
  changed: [];
}>();

const ui = useUiStore();
const state = ref<ServerState | null>(null);
const busy = ref<"check" | "reload" | "dismiss" | null>(null);
const confirmReload = ref(false);
const now = ref(Date.now());

const problem = computed(
  () => state.value != null && state.value.state !== "ok" && !state.value.dismissed
);
/** Minutes since the server last answered. */
const lastSeen = computed(() =>
  state.value?.last_seen
    ? Math.max(0, Math.floor((now.value - new Date(state.value.last_seen).getTime()) / 60000))
    : null
);

async function load() {
  try {
    state.value = await matches.serverState(props.match.id);
  } catch {
    // Shown again on the next refresh.
  }
}

async function act(kind: "check" | "reload" | "dismiss", call: () => Promise<unknown>) {
  busy.value = kind;
  try {
    const result = (await call()) as { message?: string };
    if (result?.message) ui.notify(result.message, "success");
    await load();
    emit("changed");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = null;
  }
}
const check = () => act("check", () => matches.serverCheck(props.match.id));
const dismiss = () => act("dismiss", () => matches.serverDismiss(props.match.id));
function reload() {
  confirmReload.value = false;
  void act("reload", () => matches.serverReload(props.match.id));
}

// Match updates (scores, a restart, a restore) can change the server state too.
watch(
  () => props.match,
  () => void load()
);
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  void load();
  timer = setInterval(() => {
    now.value = Date.now();
    if (document.visibilityState === "visible") void load();
  }, 20000);
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>
