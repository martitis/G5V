<template>
  <v-dialog v-model="show" persistent max-width="760">
    <v-card :title="server?.id ? $t('MyServers.FormTitleEdit') : $t('MyServers.New')">
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          <!-- Static translation text with a link (no user input). -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="$t('ServerCreate.Get5Help')" />
        </v-alert>
        <v-form ref="form" @submit.prevent="save">
          <v-text-field
            v-model="draft.display_name"
            :label="$t('ServerCreate.FormDisplayName')"
            :rules="[required]"
          />
          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model.trim="draft.ip_string"
                :label="$t('ServerCreate.FormServerIP')"
                :hint="$t('ServerCreate.FormServerHint')"
                :rules="[required, hostRule]"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field
                v-model.number="draft.port"
                type="number"
                :label="$t('ServerCreate.FormServerPort')"
                :rules="[required, portRule]"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-text-field
                v-model.number="draft.gotv_port"
                type="number"
                :label="$t('ServerCreate.FormGOTVPort')"
                :rules="[optionalPortRule]"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="draft.rcon_password"
            :label="$t('ServerCreate.FormRCONPassword')"
            :type="showPass ? 'text' : 'password'"
            :append-inner-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
            :hint="server?.id ? $t('ServerCreate.RCONKeepHint') : ''"
            persistent-hint
            autocomplete="new-password"
            :rules="[(v: string) => !!server?.id || !!v || $t('misc.Required')]"
            @click:append-inner="showPass = !showPass"
          />
          <v-row density="compact" class="align-center mt-2">
            <v-col cols="12" sm="5">
              <v-switch
                v-model="draft.public_server"
                :label="$t('ServerCreate.FormPublicServer')"
                color="primary"
                hide-details
              />
            </v-col>
            <v-col cols="9" sm="5">
              <v-select
                v-model="draft.flag"
                :items="FLAGS"
                :label="$t('MyServers.Flag')"
                clearable
                hide-details
              />
            </v-col>
            <v-col cols="3" sm="2">
              <img :src="flagUrl(draft.flag)" alt="" style="border-radius: 4px" />
            </v-col>
          </v-row>
          <button type="submit" hidden />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="busy" @click="show = false">{{ $t("misc.Cancel") }}</v-btn>
        <v-btn color="primary" :loading="busy" @click="save">{{ $t("misc.Save") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { servers } from "@/api";
import type { Server } from "@/api/types";
import { useUiStore } from "@/stores/ui";
import { FLAGS, flagUrl } from "@/utils/format";

const show = defineModel<boolean>({ default: false });
/** The server to edit, or null to add a new one. */
const props = defineProps<{ server: Server | null }>();
const emit = defineEmits<{ saved: [] }>();

const { t } = useI18n();
const ui = useUiStore();
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const showPass = ref(false);
const busy = ref(false);

// A copy: editing doesn't touch the table row until the save succeeded.
const emptyDraft = () => ({
  display_name: "",
  ip_string: "",
  port: 27015 as number | null,
  gotv_port: null as number | null,
  rcon_password: "",
  public_server: false,
  flag: null as string | null
});
const draft = reactive(emptyDraft());

watch(show, (open) => {
  if (!open) return;
  Object.assign(draft, emptyDraft());
  if (props.server) {
    Object.assign(draft, {
      display_name: props.server.display_name ?? "",
      ip_string: props.server.ip_string ?? "",
      port: props.server.port ?? 27015,
      gotv_port: props.server.gotv_port ?? null,
      public_server: Boolean(props.server.public_server),
      flag: props.server.flag || null
    });
  }
  showPass.value = false;
});

const required = (value: unknown) => (value != null && value !== "") || t("misc.Required");
// A host name or IP without a port (the port has its own field).
const hostRule = (value: string) =>
  /^[A-Za-z0-9.-]+$/.test(value ?? "") || t("ServerCreate.HostInvalid");
const portRule = (value: number) =>
  (Number.isInteger(value) && value > 0 && value < 65536) || t("ServerCreate.PortRangeIncorrect");
const optionalPortRule = (value: number | null | "") =>
  value == null || value === "" || portRule(value as number);

async function save() {
  if (!(await form.value?.validate())?.valid) return;
  busy.value = true;
  try {
    const body = {
      display_name: draft.display_name,
      ip_string: draft.ip_string,
      port: draft.port,
      gotv_port: draft.gotv_port || null,
      // Empty keeps the stored password on edit.
      rcon_password: draft.rcon_password || undefined,
      public_server: draft.public_server ? 1 : 0,
      flag: draft.flag
    };
    if (props.server?.id) {
      await servers.update({ ...body, server_id: props.server.id });
      ui.notify(t("ServerCreate.MessageeEditSuccess"), "success");
    } else {
      await servers.create(body);
      ui.notify(t("ServerCreate.MessageRegisterSuccess"), "success");
    }
    show.value = false;
    emit("saved");
  } catch (error) {
    // The dialog stays open so nothing typed is lost.
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>
