<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>{{ $t("MyServers.Title") }}</span>
        <v-spacer />
        <template v-if="auth.loggedIn">
          <v-btn
            v-if="route.meta.mine"
            color="secondary"
            variant="tonal"
            @click="showAll = !showAll"
          >
            {{ showAll ? $t("MyServers.ShowMyServers") : $t("MyServers.ShowPublicServers") }}
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-server-plus" @click="openDialog(null)">
            {{ $t("MyServers.New") }}
          </v-btn>
        </template>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="servers"
        :loading="loading"
        :loading-text="$t('misc.LoadText')"
        :no-data-text="$t('MyServers.NoServersFound')"
        item-value="id"
        density="comfortable"
      >
        <template #[`item.display_name`]="{ item }">
          <img v-if="item.flag" :src="flagUrl(item.flag)" alt="" class="mr-2" style="border-radius: 3px; vertical-align: middle" />
          {{ item.display_name }}
        </template>
        <template #[`item.address`]="{ item }">
          <span v-if="item.ip_string">{{ item.ip_string }}:{{ item.port }}</span>
        </template>
        <template #[`item.in_use`]="{ item }">
          <v-chip :color="item.in_use ? 'warning' : 'success'" size="small" variant="tonal" label>
            {{ item.in_use ? $t("MyServers.InUse") : $t("MyServers.Free") }}
          </v-chip>
        </template>
        <template #[`item.public_server`]="{ item }">
          <v-icon :color="item.public_server ? 'success' : undefined">
            {{ item.public_server ? "mdi-earth" : "mdi-lock" }}
          </v-icon>
        </template>
        <template #[`item.rcon`]="{ item }">
          <template v-if="auth.canEdit(item.user_id)">
            <code v-if="rcon[item.id] !== undefined" class="mr-1">{{ rcon[item.id] }}</code>
            <v-btn
              :icon="rcon[item.id] !== undefined ? 'mdi-eye-off' : 'mdi-eye'"
              size="small"
              variant="text"
              :title="$t('MyServers.RCONPass')"
              @click="toggleRcon(item.id)"
            />
          </template>
        </template>
        <template #[`item.actions`]="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-btn
              size="small"
              variant="tonal"
              :color="statusColor[item.id] ?? 'grey'"
              :loading="checking[item.id]"
              prepend-icon="mdi-heart-pulse"
              @click="checkStatus(item.id)"
            >
              {{ $t("MyServers.Status") }}
            </v-btn>
            <template v-if="auth.canEdit(item.user_id)">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="toDelete = item" />
            </template>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <ServerDialog v-model="dialog" :server="editing" @saved="load" />

    <v-dialog :model-value="toDelete !== null" max-width="480" @update:model-value="toDelete = null">
      <v-card :title="$t('MyServers.DeleteConfirmation')" :text="toDelete?.display_name">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="toDelete = null">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="error" :loading="deleting" @click="confirmDelete">{{ $t("misc.Delete") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { servers as serversApi } from "@/api";
import type { Server } from "@/api/types";
import ServerDialog from "@/components/ServerDialog.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { flagUrl } from "@/utils/format";

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const servers = ref<Server[]>([]);
const loading = ref(true);
const showAll = ref(false);
const dialog = ref(false);
const editing = ref<Server | null>(null);
const toDelete = ref<Server | null>(null);
const deleting = ref(false);
/** Revealed RCON passwords, by server id (fetched on demand, never part of the list). */
const rcon = reactive<Record<number, string>>({});
const checking = reactive<Record<number, boolean>>({});
const statusColor = reactive<Record<number, string>>({});

const headers = computed(() => [
  { title: t("MyServers.ID"), key: "id" },
  { title: t("MyServers.Name"), key: "display_name" },
  { title: t("MyServers.Host"), key: "address", sortable: false },
  { title: t("MyServers.InUse"), key: "in_use" },
  { title: t("MyServers.IsPublic"), key: "public_server" },
  { title: t("MyServers.Owner"), key: "name" },
  { title: t("MyServers.RCONPass"), key: "rcon", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" as const }
]);

async function load() {
  loading.value = true;
  try {
    await auth.load();
    servers.value = route.meta.mine && !showAll.value ? await serversApi.mine() : await serversApi.all();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

function openDialog(server: Server | null) {
  editing.value = server;
  dialog.value = true;
}

async function toggleRcon(id: number) {
  if (rcon[id] !== undefined) {
    delete rcon[id];
    return;
  }
  try {
    rcon[id] = await serversApi.rconPassword(id);
  } catch (error) {
    ui.notifyError(error);
  }
}

async function checkStatus(id: number) {
  checking[id] = true;
  try {
    const result = await serversApi.status(id);
    statusColor[id] = "success";
    ui.notify(result.message, "success");
  } catch (error) {
    statusColor[id] = "error";
    ui.notifyError(error);
  } finally {
    checking[id] = false;
  }
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    const result = await serversApi.remove(toDelete.value.id);
    ui.notify(result.message, "success");
    toDelete.value = null;
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    deleting.value = false;
  }
}

watch(showAll, load);
onMounted(load);
</script>
