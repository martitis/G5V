<template>
  <v-dialog v-model="show" max-width="480">
    <v-card :title="addLogin ? $t('User.AddLogin') : $t('User.ResetPass')">
      <v-card-text>
        <div v-if="addLogin" class="text-body-medium text-medium-emphasis mb-4">
          {{ $t("User.AddLoginInfo") }}
        </div>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>
        <v-form ref="form" @submit.prevent="save">
          <v-text-field
            v-if="addLogin"
            v-model="username"
            :label="$t('Login.UsernameLabel')"
            :hint="$t('Login.UsernameHint')"
            autocomplete="username"
            prepend-inner-icon="mdi-account"
            :rules="[required, usernameRule]"
            class="mb-1"
            autofocus
          />
          <v-text-field
            v-else
            v-model="oldPassword"
            :label="$t('Login.OldPasswordLabel')"
            type="password"
            autocomplete="current-password"
            prepend-inner-icon="mdi-lock-open"
            :rules="[required]"
            autofocus
          />
          <v-text-field
            v-model="newPassword"
            :label="addLogin ? $t('Login.PasswordLabel') : $t('Login.NewPasswordLabel')"
            :hint="$t('Login.PasswordHint', { n: auth.passwordMin })"
            :type="showPass ? 'text' : 'password'"
            :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock"
            :rules="[required, passwordRule]"
            class="mb-1"
            @click:append-inner="showPass = !showPass"
          />
          <v-text-field
            v-model="repeat"
            :label="$t('Login.RepeatPassword')"
            :type="showPass ? 'text' : 'password'"
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock-check"
            :rules="[required, sameRule]"
          />
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
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { users } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { usernameRule as usernameValid } from "@/utils/credentials";

/**
 * Change your password, or (addLogin) add a username and password to an account that signs in with Steam,
 * so it can also sign in without Steam.
 */
const show = defineModel<boolean>({ default: false });
const props = defineProps<{ userId: number; addLogin?: boolean }>();
const emit = defineEmits<{ saved: [] }>();

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const username = ref("");
const oldPassword = ref("");
const newPassword = ref("");
const repeat = ref("");
const showPass = ref(false);
const busy = ref(false);
const error = ref("");

watch(show, (open) => {
  if (!open) return;
  oldPassword.value = "";
  newPassword.value = "";
  repeat.value = "";
  showPass.value = false;
  error.value = "";
});

const required = (value: string) => !!value?.trim() || t("misc.Required");
const usernameRule = (value: string) => usernameValid(value) || t("Login.UsernameHint");
const passwordRule = (value: string) =>
  (value?.length ?? 0) >= auth.passwordMin || t("Login.PasswordHint", { n: auth.passwordMin });
const sameRule = (value: string) => value === newPassword.value || t("Login.PasswordsDiffer");

async function save() {
  if (busy.value || !(await form.value?.validate())?.valid) return;
  busy.value = true;
  error.value = "";
  try {
    await users.update(
      props.addLogin
        ? { id: props.userId, username: username.value.trim(), password: newPassword.value }
        : { id: props.userId, old_password: oldPassword.value, password: newPassword.value }
    );
    ui.notify(props.addLogin ? t("User.LoginAdded") : t("User.PasswordChanged"), "success");
    show.value = false;
    emit("saved");
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    busy.value = false;
  }
}
</script>
