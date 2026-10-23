<template>
  <v-dialog v-model="show" max-width="720">
    <v-card :title="$t('Login.title')">
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          <!-- Static translation text with a link (no user input). -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="$t('Login.Info')" />
        </v-alert>
        <v-form ref="form" @submit.prevent="login">
          <v-text-field
            v-model="steamId"
            :label="$t('Login.SteamIdLabel')"
            :hint="$t('Login.SteamIdHint')"
            persistent-hint
            class="mb-2"
          />
          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="username"
                :label="$t('Login.UsernameLabel')"
                autocomplete="username"
                :rules="[required]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="password"
                :label="$t('Login.PasswordLabel')"
                :type="showPass ? 'text' : 'password'"
                :append-inner-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
                autocomplete="current-password"
                :rules="[required]"
                @click:append-inner="showPass = !showPass"
              />
            </v-col>
          </v-row>
          <!-- Enables Enter to submit. -->
          <button type="submit" hidden />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="busy" @click="register">{{ $t("Login.Register") }}</v-btn>
        <v-btn color="primary" :loading="busy" @click="login">{{ $t("Login.Login") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { auth as authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { isSteamId64 } from "@/utils/format";

const show = defineModel<boolean>({ default: false });
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const steamId = ref("");
const username = ref("");
const password = ref("");
const showPass = ref(false);
const busy = ref(false);

const required = (value: string) => !!value || t("misc.Required");

async function submit(action: () => Promise<unknown>) {
  if (!(await form.value?.validate())?.valid) return;
  busy.value = true;
  try {
    await action();
    await auth.load(true);
    show.value = false;
    password.value = "";
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

const login = () => submit(() => authApi.login(username.value, password.value));

function register() {
  if (!isSteamId64(steamId.value)) {
    ui.notify(t("Login.SteamIdInvalid"), "error");
    return;
  }
  return submit(() => authApi.register(username.value, password.value, steamId.value.trim()));
}
</script>
