<template>
  <v-menu
    v-model="open"
    :close-on-content-click="true"
    location="bottom"
    max-height="480"
    :open-on-click="false"
  >
    <template #activator="{ props: activator }">
      <v-text-field
        v-bind="activator"
        v-model="query"
        :placeholder="$t('Search.Placeholder')"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="solo-filled"
        flat
        hide-details
        clearable
        class="global-search"
        @focus="open = query.length > 0"
        @keydown.enter="openFirst"
        @keydown.esc="open = false"
      />
    </template>
    <v-card min-width="340">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-list density="compact">
        <v-list-item v-if="query.trim().length < 2" :title="$t('Search.TypeMore')" disabled />
        <v-list-item
          v-else-if="!loading && !entries.length"
          :title="$t('Search.NoResults')"
          disabled
        />
        <template v-for="group in groups" :key="group.title">
          <v-list-subheader>{{ group.title }}</v-list-subheader>
          <v-list-item
            v-for="entry in group.entries"
            :key="entry.key"
            :to="entry.to"
            :title="entry.title"
            :subtitle="entry.subtitle"
            :prepend-icon="entry.image ? undefined : entry.icon"
          >
            <template v-if="entry.image" #prepend>
              <v-avatar size="24" class="mr-2"><v-img :src="entry.image" alt="" /></v-avatar>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { search } from "@/api";
import type { SearchResults } from "@/api/types";
import { logoUrl, matchTitle } from "@/utils/format";

/** Top bar search: teams, players, matches and tournaments, as you type. */
const { t } = useI18n();
const router = useRouter();
const query = ref("");
const open = ref(false);
const loading = ref(false);
const results = ref<SearchResults | null>(null);

interface Entry {
  key: string;
  to: string;
  title: string;
  subtitle?: string;
  icon: string;
  image?: string | null;
}

const groups = computed(() => {
  const r = results.value;
  if (!r || query.value.trim().length < 2) return [];
  const list: { title: string; entries: Entry[] }[] = [
    {
      title: t("Search.Teams"),
      entries: r.teams.map((team) => ({
        key: `team-${team.id}`,
        to: `/teams/${team.id}`,
        title: team.name,
        subtitle: team.tag ?? undefined,
        icon: "mdi-shield-account",
        image: team.logo ? logoUrl(team.logo) : null
      }))
    },
    {
      title: t("Search.Players"),
      entries: r.players.map((player) => ({
        key: `player-${player.steam_id}`,
        to: `/user/${player.user_id ?? player.steam_id}`,
        title: player.name || player.steam_id,
        subtitle: player.steam_id,
        icon: "mdi-account",
        image: player.image
      }))
    },
    {
      title: t("Search.Matches"),
      entries: r.matches.map((match) => ({
        key: `match-${match.id}`,
        to: `/match/${match.id}`,
        title: `${match.team1_string} vs ${match.team2_string}`,
        subtitle: matchTitle(match.title) || `#${match.id}`,
        icon: "mdi-sword-cross"
      }))
    },
    {
      title: t("Search.Tournaments"),
      entries: r.tournaments.map((tournament) => ({
        key: `tournament-${tournament.id}`,
        to: `/tournament/${tournament.id}`,
        title: tournament.name,
        subtitle: t(`Tournament.${tournament.format}`),
        icon: "mdi-tournament"
      }))
    }
  ];
  return list.filter((group) => group.entries.length);
});
const entries = computed(() => groups.value.flatMap((group) => group.entries));

// Ask the API once typing pauses; a slower, older answer never replaces a newer one.
let timer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;
watch(query, (value) => {
  const text = (value ?? "").trim();
  open.value = text.length > 0;
  if (timer) clearTimeout(timer);
  if (text.length < 2) {
    results.value = null;
    return;
  }
  timer = setTimeout(async () => {
    const id = ++requestId;
    loading.value = true;
    try {
      const found = await search(text);
      if (id === requestId) results.value = found;
    } catch {
      if (id === requestId) results.value = null;
    } finally {
      if (id === requestId) loading.value = false;
    }
  }, 250);
});

function openFirst() {
  const first = entries.value[0];
  if (!first) return;
  open.value = false;
  query.value = "";
  void router.push(first.to);
}
</script>

<style scoped>
/* Shrinks before it can touch the buttons next to it. */
.global-search {
  flex: 0 1 340px;
  min-width: 140px;
}
</style>
