<template>
  <v-card :variant="compact ? 'text' : 'elevated'">
    <v-card-title v-if="title || $slots.actions" class="d-flex align-center flex-wrap ga-2">
      <span>{{ title }}</span>
      <span v-if="!compact && total" class="text-body-small text-medium-emphasis">
        {{ $t("Matches.Total", { n: total }) }}
      </span>
      <v-spacer />
      <slot name="actions" />
    </v-card-title>

    <v-card-text v-if="filters" class="d-flex flex-wrap align-center ga-3 pb-0">
      <v-select
        v-model="status"
        :items="statusItems"
        density="compact"
        hide-details
        style="max-width: 260px"
      />
      <v-select
        v-if="!fixed.season_id && seasons.length"
        v-model="seasonId"
        :items="seasonItems"
        :label="$t('Match.Season')"
        density="compact"
        hide-details
        clearable
        style="max-width: 220px"
      />
      <v-text-field
        v-model="search"
        :label="$t('misc.Search')"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        clearable
        style="max-width: 260px"
      />
      <v-switch
        v-if="auth.loggedIn && !fixed.mine && !hideMineToggle"
        v-model="onlyMine"
        :label="$t('Matches.OnlyMine')"
        color="primary"
        density="compact"
        hide-details
      />
    </v-card-text>

    <v-card-text>
      <div v-if="loading && !rows.length" class="d-flex flex-column ga-2">
        <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" />
      </div>
      <div v-else-if="!rows.length" class="text-medium-emphasis py-4 text-center">
        {{ $t("Matches.NoMatches") }}
      </div>
      <div v-else class="d-flex flex-column ga-2" :class="{ 'opacity-60': loading }">
        <MatchRow v-for="match in rows" :key="match.id" :match="match" />
      </div>
      <div v-if="pages > 1" class="d-flex justify-center mt-4">
        <v-pagination v-model="page" :length="pages" :total-visible="7" density="comfortable" />
      </div>
    </v-card-text>

    <MatchListStream
      v-if="live"
      :key="streamKey"
      :ids="rows.map((row) => row.id)"
      @summaries="merge"
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { matches, seasons as seasonsApi } from "@/api";
import type { MatchSummary, Season, SummaryQuery } from "@/api/types";
import MatchListStream from "@/components/matchlist/MatchListStream.vue";
import MatchRow from "@/components/matchlist/MatchRow.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

type StatusFilter = "default" | NonNullable<SummaryQuery["status"]>;

const props = withDefaults(
  defineProps<{
    title?: string;
    /** Filters the page always applies (a season's or team's matches, "my matches"). */
    fixed?: Pick<SummaryQuery, "season_id" | "team_id" | "server_id" | "mine">;
    /** Show the filter bar. */
    filters?: boolean;
    pageSize?: number;
    /** No pagination or filters; for the home page. */
    compact?: boolean;
    /** Status filter to start with. */
    initialStatus?: StatusFilter;
    /** Keep the listed matches updated over SSE. */
    live?: boolean;
    /** The page has its own "Only mine" switch (Matches). */
    hideMineToggle?: boolean;
  }>(),
  {
    title: undefined,
    fixed: () => ({}),
    filters: true,
    pageSize: 20,
    compact: false,
    initialStatus: "default",
    live: true,
    hideMineToggle: false
  }
);
const emit = defineEmits<{ loaded: [matches: MatchSummary[]] }>();

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const rows = ref<MatchSummary[]>([]);
const total = ref(0);
const loading = ref(true);
const page = ref(1);
const status = ref<StatusFilter>(props.initialStatus);
const seasonId = ref<number | null>(null);
const search = ref("");
const onlyMine = ref(false);
const seasons = ref<Season[]>([]);

const pages = computed(() => (props.compact ? 1 : Math.ceil(total.value / props.pageSize)));
const streamKey = computed(() => rows.value.map((row) => row.id).join(","));

const statusItems = computed(() => [
  { value: "default", title: t("Matches.FilterActiveFinished") },
  { value: "active", title: t("Matches.FilterActive") },
  { value: "finished", title: t("Matches.FilterFinished") },
  { value: "cancelled", title: t("Matches.FilterCancelled") },
  { value: "all", title: t("Matches.FilterAll") }
]);
const seasonItems = computed(() =>
  seasons.value.map((season) => ({ value: season.id, title: season.name }))
);

const query = computed<SummaryQuery>(() => ({
  ...props.fixed,
  status: status.value === "default" ? undefined : status.value,
  season_id: props.fixed.season_id ?? seasonId.value ?? undefined,
  mine: props.fixed.mine || onlyMine.value || undefined,
  q: search.value?.trim() || undefined,
  limit: props.pageSize,
  offset: (page.value - 1) * props.pageSize
}));

let requestId = 0;
async function load() {
  const id = ++requestId;
  loading.value = true;
  try {
    const result = await matches.summary(query.value);
    // A slower, older request must not overwrite a newer one.
    if (id !== requestId) return;
    rows.value = result.matches;
    total.value = result.total;
    emit("loaded", result.matches);
  } catch (error) {
    if (id === requestId) ui.notifyError(error);
  } finally {
    if (id === requestId) loading.value = false;
  }
}

/** Live updates: refresh listed matches in place; a newly active match reloads the first page. */
let reloadTimer: ReturnType<typeof setTimeout> | null = null;
function merge(summaries: MatchSummary[]) {
  const byId = new Map(summaries.map((summary) => [summary.id, summary]));
  rows.value = rows.value.map((row) => byId.get(row.id) ?? row);
  const listed = new Set(rows.value.map((row) => row.id));
  const isNew = summaries.some(
    (summary) =>
      !listed.has(summary.id) && summary.status !== "finished" && summary.status !== "cancelled"
  );
  if (isNew && page.value === 1 && !reloadTimer) {
    reloadTimer = setTimeout(() => {
      reloadTimer = null;
      void load();
    }, 1000);
  }
}

// Filters go back to the first page; typing waits for a pause.
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (page.value === 1) void load();
    else page.value = 1;
  }, 300);
});
// fixed is compared by value: pages pass it as an inline object.
watch([status, seasonId, onlyMine, () => JSON.stringify(props.fixed)], () => {
  if (page.value === 1) void load();
  else page.value = 1;
});
watch(page, load);

onMounted(async () => {
  await auth.load();
  void load();
  if (props.filters && !props.compact && !props.fixed.season_id) {
    seasons.value = await seasonsApi.all().catch(() => []);
  }
});

defineExpose({ reload: load });
</script>
