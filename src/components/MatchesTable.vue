<template>
  <v-card>
    <v-card-title v-if="title || $slots.actions" class="d-flex align-center flex-wrap ga-2">
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="rows"
      :loading="loading"
      :loading-text="$t('misc.LoadText')"
      :no-data-text="$t('misc.NoData')"
      :sort-by="[{ key: 'id', order: 'desc' }]"
      item-value="id"
      density="comfortable"
    >
      <template #[`item.id`]="{ item }">
        <router-link v-if="!isCancelled(item)" :to="`/match/${item.id}`" class="app-link">
          {{ item.id }}
        </router-link>
        <span v-else>{{ item.id }}</span>
      </template>
      <template #[`item.team1_string`]="{ item }">
        <router-link v-if="item.team1_id" :to="`/teams/${item.team1_id}`" class="app-link">
          {{ item.team1_string }}
        </router-link>
        <span v-else>{{ item.team1_string }}</span>
      </template>
      <template #[`item.team2_string`]="{ item }">
        <router-link v-if="item.team2_id" :to="`/teams/${item.team2_id}`" class="app-link">
          {{ item.team2_string }}
        </router-link>
        <span v-else>{{ item.team2_string }}</span>
      </template>
      <template #[`item.status`]="{ item }">
        <v-chip :color="item.status.color" size="small" variant="tonal" label>
          {{ item.status.label }}
        </v-chip>
      </template>
      <template #[`item.score`]="{ item }">
        <span class="font-weight-medium">{{ item.score[0] }} : {{ item.score[1] }}</span>
      </template>
      <template #[`item.owner`]="{ item }">
        <router-link :to="`/user/${item.user_id}`" class="app-link">
          {{ item.owner || `#${item.user_id}` }}
        </router-link>
      </template>
      <template #[`item.ip_string`]="{ item }">
        <span v-if="item.ip_string">{{ item.ip_string }}:{{ item.port }}</span>
      </template>
      <template #[`item.connect`]="{ item }">
        <!-- Only for matches being played on a known server. -->
        <v-btn
          v-if="isLive(item) && item.ip_string"
          :href="`steam://connect/${item.ip_string}:${item.port}`"
          color="primary"
          size="small"
          prepend-icon="mdi-play"
        >
          {{ $t("Match.Connect") }}
        </v-btn>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { users } from "@/api";
import type { Match } from "@/api/types";
import { useUiStore } from "@/stores/ui";
import { displayScore, isCancelled, isLive } from "@/utils/format";

/** `load` returns the matches to list; it is called again when it changes or on `reload()`. */
const props = defineProps<{ load: () => Promise<Match[]>; title?: string }>();
const emit = defineEmits<{ loaded: [matches: Match[]] }>();

const { t } = useI18n();
const ui = useUiStore();
const matches = ref<Match[]>([]);
const loading = ref(true);
/** user id -> name, for lists whose rows don't carry the owner's name. */
const ownerNames = ref<Record<number, string>>({});

function status(match: Match): { label: string; color: string } {
  if (isCancelled(match)) return { label: t("Matches.StatusCancelled"), color: "grey" };
  if (isLive(match)) return { label: t("Matches.StatusLive"), color: "error" };
  if (match.end_time == null && match.forfeit != 1) {
    return { label: t("Matches.StatusUpcoming"), color: "info" };
  }
  const winner =
    match.winner == null
      ? null
      : match.winner === match.team1_id
        ? match.team1_string
        : match.winner === match.team2_id
          ? match.team2_string
          : null;
  if (match.forfeit == 1 && winner) return { label: t("Matches.StatusForfeit", { team: winner }), color: "warning" };
  if (winner) return { label: t("Matches.StatusWon", { team: winner }), color: "success" };
  const [a, b] = displayScore(match);
  return a === b
    ? { label: t("Matches.StatusTie"), color: "secondary" }
    : { label: t("Matches.StatusFinished"), color: "secondary" };
}

const rows = computed(() =>
  matches.value.map((match) => ({
    ...match,
    owner: match.owner || ownerNames.value[match.user_id],
    status: status(match),
    score: displayScore(match)
  }))
);

const hasServers = computed(() => matches.value.some((match) => match.ip_string));
const headers = computed(() => [
  { title: t("Matches.MatchID"), key: "id" },
  { title: t("Matches.Team1"), key: "team1_string" },
  { title: t("Matches.Team2"), key: "team2_string" },
  { title: t("Matches.Score"), key: "score", sortable: false },
  { title: t("Matches.Status"), key: "status", sortable: false },
  { title: t("Matches.Owner"), key: "owner" },
  // Only /matches/mymatches returns server details; don't show empty columns elsewhere.
  ...(hasServers.value
    ? [
        { title: t("Matches.server_name"), key: "server_name" },
        { title: t("Matches.ip_string"), key: "ip_string" },
        { title: t("Matches.ConnectButton"), key: "connect", sortable: false }
      ]
    : [])
]);

async function reload() {
  loading.value = true;
  try {
    matches.value = await props.load();
    emit("loaded", matches.value);
    // One request per distinct owner (the old table made two requests per row).
    const missing = [...new Set(matches.value.filter((m) => !m.owner).map((m) => m.user_id))].filter(
      (id) => !(id in ownerNames.value)
    );
    const names = await Promise.all(
      missing.map((id) => users.get(id).then((user) => [id, user.name] as const).catch(() => [id, ""] as const))
    );
    ownerNames.value = { ...ownerNames.value, ...Object.fromEntries(names) };
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

watch(() => props.load, reload, { immediate: true });
defineExpose({ reload });
</script>
