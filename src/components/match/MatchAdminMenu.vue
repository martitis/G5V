<template>
  <div>
    <v-menu location="bottom end">
      <template #activator="{ props: activator }">
        <v-btn
          v-bind="activator"
          color="primary"
          prepend-icon="mdi-shield-crown"
          append-icon="mdi-menu-down"
          :loading="busy"
        >
          {{ $t("MatchAdmin.AdminTools") }}
        </v-btn>
      </template>
      <v-list density="compact" min-width="260">
        <v-list-item prepend-icon="mdi-pause" :title="$t('MatchAdmin.PauseMatch')" @click="pause" />
        <v-list-item
          prepend-icon="mdi-play"
          :title="$t('MatchAdmin.UnpauseMatch')"
          @click="unpause"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="$t('MatchAdmin.AddPlayerToServer')"
          @click="open('add')"
        />
        <v-list-item
          prepend-icon="mdi-account-remove"
          :title="$t('MatchAdmin.RemovePlayer')"
          @click="open('remove')"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-backup-restore"
          :title="$t('MatchAdmin.ListBackups')"
          @click="openBackups"
        />
        <v-list-item
          prepend-icon="mdi-server-network"
          :title="$t('MatchAdmin.ChangeServer')"
          @click="openServerChange"
        />
        <v-list-item
          prepend-icon="mdi-console"
          :title="$t('MatchAdmin.SendRCON')"
          @click="open('rcon')"
        />
        <v-list-item
          prepend-icon="mdi-link-variant"
          :title="$t('MatchAdmin.UpdateCallbacks')"
          @click="updateCallbacks"
        />
        <v-list-item
          prepend-icon="mdi-code-json"
          :title="$t('MatchAdmin.ConfigPreview')"
          @click="showConfig"
        />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-restart"
          :title="$t('MatchAdmin.MatchRestart')"
          @click="open('restart')"
        />
        <v-list-item
          prepend-icon="mdi-flag"
          :title="$t('MatchAdmin.ForfeitMatch')"
          @click="open('forfeit')"
        />
        <v-list-item
          prepend-icon="mdi-cancel"
          base-color="error"
          :title="$t('MatchAdmin.CancelMatch')"
          @click="open('cancel')"
        />
      </v-list>
    </v-menu>

    <!-- Add / remove player -->
    <v-dialog
      :model-value="dialog === 'add' || dialog === 'remove'"
      max-width="560"
      @update:model-value="close"
    >
      <v-card
        :title="
          dialog === 'add' ? $t('MatchAdmin.AddPlayerToServer') : $t('MatchAdmin.RemovePlayer')
        "
      >
        <v-card-text>
          <v-form ref="playerForm" @submit.prevent>
            <v-text-field
              v-model.trim="player.steam"
              :label="$t('MatchAdmin.SteamLabel')"
              :hint="$t('MatchAdmin.SteamHint')"
              persistent-hint
              placeholder="7656…"
              :rules="[(v: string) => !!v || $t('MatchAdmin.SteamRuleRequired')]"
              autofocus
            />
            <v-text-field
              v-if="dialog === 'add'"
              v-model="player.nickname"
              :label="$t('Team.NickLabel')"
              :hint="$t('MatchAdmin.SteamNicknameHint')"
              counter="40"
              :rules="[(v: string) => (v ?? '').length <= 40 || $t('MatchAdmin.SteamNickRule')]"
              class="mt-2"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="flex-wrap">
          <v-btn variant="text" @click="close">{{ $t("misc.Cancel") }}</v-btn>
          <v-spacer />
          <template v-if="dialog === 'add'">
            <v-btn variant="tonal" :loading="busy" @click="addPlayer('spec')">{{
              $t("MatchAdmin.AddToSpec")
            }}</v-btn>
            <v-btn color="primary" variant="tonal" :loading="busy" @click="addPlayer('team1')">
              {{ match.team1_string }}
            </v-btn>
            <v-btn color="primary" variant="tonal" :loading="busy" @click="addPlayer('team2')">
              {{ match.team2_string }}
            </v-btn>
          </template>
          <v-btn v-else color="error" :loading="busy" @click="removePlayer">{{
            $t("misc.Delete")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Backups -->
    <v-dialog :model-value="dialog === 'backup'" max-width="560" @update:model-value="close">
      <v-card :title="$t('MatchAdmin.LoadBackupFile')">
        <v-card-text>
          <v-select
            v-model="selectedBackup"
            :items="backupItems"
            :label="$t('MatchAdmin.Backup')"
            :no-data-text="$t('MatchAdmin.NoBackups')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="primary" :loading="busy" :disabled="!selectedBackup" @click="restoreBackup">
            {{ $t("MatchAdmin.Restore") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Change server -->
    <v-dialog :model-value="dialog === 'server'" max-width="600" @update:model-value="close">
      <v-card :title="$t('MatchAdmin.ChangeServer')">
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">{{
            $t("MatchAdmin.ServerChangeNote")
          }}</v-alert>
          <v-select
            v-model="newServer"
            :items="servers"
            item-title="display_name"
            item-value="id"
            :label="$t('CreateMatch.ServerLabel')"
          />
          <v-select
            v-model="remoteBackup"
            :items="remoteBackups"
            :label="$t('MatchAdmin.Backup')"
            :no-data-text="$t('MatchAdmin.NoBackups')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn
            color="error"
            :loading="busy"
            :disabled="!newServer || !remoteBackup"
            @click="changeServer"
          >
            {{ $t("misc.Change") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- RCON -->
    <v-dialog :model-value="dialog === 'rcon'" max-width="640" @update:model-value="close">
      <v-card :title="$t('MatchAdmin.RCONDialog')">
        <v-card-text>
          <v-text-field
            v-model="rconCommand"
            :label="$t('MatchAdmin.RCONCommand')"
            :hint="$t('MatchAdmin.RCONHint')"
            placeholder="status"
            autofocus
            @keyup.enter="sendRcon"
          />
          <pre v-if="rconOutput" class="console mt-2">{{ rconOutput }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ $t("misc.Close") }}</v-btn>
          <v-btn color="primary" :loading="busy" :disabled="!rconCommand" @click="sendRcon">
            {{ $t("MatchAdmin.SendRCON") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmations -->
    <v-dialog
      :model-value="dialog === 'restart' || dialog === 'cancel'"
      max-width="480"
      @update:model-value="close"
    >
      <v-card
        :title="
          dialog === 'restart'
            ? $t('MatchAdmin.MatchRestartInfo')
            : $t('MatchAdmin.CancelMatchConfirm')
        "
      >
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">{{ $t("misc.No") }}</v-btn>
          <v-btn color="error" :loading="busy" @click="confirm">{{ $t("misc.Yes") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog :model-value="dialog === 'forfeit'" max-width="520" @update:model-value="close">
      <v-card :title="$t('MatchAdmin.ForfeitConfirm')" :text="$t('MatchAdmin.ForfeitChoice')">
        <v-card-actions class="flex-wrap">
          <v-btn variant="text" @click="close">{{ $t("misc.Cancel") }}</v-btn>
          <v-spacer />
          <v-btn color="warning" variant="tonal" :loading="busy" @click="forfeit(1)">
            {{ $t("MatchAdmin.TeamWins", { team: match.team1_string }) }}
          </v-btn>
          <v-btn color="warning" variant="tonal" :loading="busy" @click="forfeit(2)">
            {{ $t("MatchAdmin.TeamWins", { team: match.team2_string }) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Server output / config -->
    <v-dialog
      :model-value="output !== null"
      max-width="760"
      scrollable
      @update:model-value="output = null"
    >
      <v-card :title="output?.title">
        <v-card-text>
          <pre class="console">{{ output?.text }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="output = null">{{ $t("misc.Close") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { matches, servers as serversApi } from "@/api";
import type { MessageResponse } from "@/api/http";
import type { BackupEntry, Match, Server } from "@/api/types";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

/** RCON actions on a running match (owner or admin; the API checks every action again). */
const props = defineProps<{ match: Match }>();
const emit = defineEmits<{ changed: [] }>();

type Dialog =
  "add" | "remove" | "backup" | "server" | "rcon" | "restart" | "cancel" | "forfeit" | null;

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();
const busy = ref(false);
const dialog = ref<Dialog>(null);
const output = ref<{ title: string; text: string } | null>(null);
const playerForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const player = reactive({ steam: "", nickname: "" });
const backups = ref<BackupEntry[]>([]);
const selectedBackup = ref<string | null>(null);
const servers = ref<Server[]>([]);
const newServer = ref<number | null>(null);
const remoteBackups = ref<string[]>([]);
const remoteBackup = ref<string | null>(null);
const rconCommand = ref("");
const rconOutput = ref("");

const backupItems = computed(() =>
  [...backups.value]
    .sort((a, b) => b.map_number - a.map_number || b.round - a.round)
    .map((backup) => ({
      value: backup.file,
      title:
        t("MatchAdmin.BackupItem", { map: backup.map_number + 1, round: backup.round }) +
        (backup.info ? ` · ${backup.info}` : "")
    }))
);

function open(name: Dialog) {
  player.steam = "";
  player.nickname = "";
  rconCommand.value = "";
  rconOutput.value = "";
  dialog.value = name;
}

function close() {
  if (!busy.value) dialog.value = null;
}

/** Shows what the game server answered; plain success messages go to the snackbar. */
function report(result: MessageResponse & { response?: string }) {
  if (result.response)
    output.value = { title: t("MatchAdmin.Response"), text: String(result.response) };
  else ui.notify(result.message || t("MatchAdmin.Done"), "success");
}

async function run(
  action: () => Promise<MessageResponse & { response?: string }>,
  closeDialog = true
) {
  busy.value = true;
  try {
    report(await action());
    if (closeDialog) dialog.value = null;
    emit("changed");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

const updateCallbacks = () => run(() => matches.updateCallbacks(props.match.id));
const pause = () => run(() => matches.pause(props.match.id));
const unpause = () => run(() => matches.unpause(props.match.id));

async function addPlayer(team: "team1" | "team2" | "spec") {
  if (!(await playerForm.value?.validate())?.valid) return;
  const body = { steam_id: player.steam, nickname: player.nickname, team_id: team };
  await run(() =>
    team === "spec"
      ? matches.addSpectator(props.match.id, body)
      : matches.addPlayer(props.match.id, body)
  );
}

async function removePlayer() {
  if (!(await playerForm.value?.validate())?.valid) return;
  await run(() => matches.removePlayer(props.match.id, player.steam));
}

async function openBackups() {
  busy.value = true;
  try {
    backups.value = await matches.backups(props.match.id);
    selectedBackup.value = backupItems.value[0]?.value ?? null;
    dialog.value = "backup";
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

async function restoreBackup() {
  const file = selectedBackup.value;
  if (file) await run(() => matches.restoreBackup(props.match.id, file));
}

async function openServerChange() {
  busy.value = true;
  try {
    const [available, remote] = await Promise.all([
      serversApi.available(),
      matches.remoteBackups(props.match.id)
    ]);
    // The user's own servers first, then public ones.
    servers.value = [...available].sort(
      (a, b) =>
        Number(b.user_id === auth.user?.id) - Number(a.user_id === auth.user?.id) ||
        Number(b.public_server) - Number(a.public_server)
    );
    remoteBackups.value = remote;
    newServer.value = null;
    remoteBackup.value = remote.at(-1) ?? null;
    dialog.value = "server";
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

async function changeServer() {
  const serverId = newServer.value;
  const file = remoteBackup.value;
  if (!serverId || !file) return;
  await run(async () => {
    await matches.update({ match_id: props.match.id, server_id: serverId });
    return matches.restoreRemoteBackup(props.match.id, serverId, file);
  });
}

async function sendRcon() {
  if (!rconCommand.value) return;
  busy.value = true;
  try {
    const result = await matches.rcon(props.match.id, rconCommand.value);
    rconOutput.value = result.response || result.message;
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

async function confirm() {
  if (dialog.value === "restart") await run(() => matches.restart(props.match.id));
  else if (dialog.value === "cancel") await run(() => matches.cancel(props.match.id));
}

async function forfeit(winner: 1 | 2) {
  await run(() => matches.forfeit(props.match.id, winner));
}

async function showConfig() {
  busy.value = true;
  try {
    const config = await matches.config(props.match.id);
    output.value = { title: t("MatchAdmin.ConfigPreview"), text: JSON.stringify(config, null, 2) };
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.console {
  background: #111;
  color: #d6d6d6;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
  padding: 12px;
  border-radius: 6px;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
