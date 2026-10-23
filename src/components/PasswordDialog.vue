<template>
  <v-dialog v-model="show" max-width="520">
    <v-card :title="$t('User.ResetPass')">
      <v-card-text>
        <v-form ref="form" @submit.prevent="save">
          <v-text-field
            v-model="oldPassword"
            :label="$t('Login.OldPasswordLabel')"
            type="password"
            autocomplete="current-password"
            :rules="[required]"
          />
          <v-text-field
            v-model="newPassword"
            :label="$t('Login.NewPasswordLabel')"
            :type="showPass ? 'text' : 'password'"
            :append-inner-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
            autocomplete="new-password"
            :rules="[required]"
            @click:append-inner="showPass = !showPass"
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
import { useUiStore } from "@/stores/ui";

const show = defineModel<boolean>({ default: false });
const props = defineProps<{ userId: number }>();

const { t } = useI18n();
const ui = useUiStore();
const form = ref<{ validate: () => Promise<{ valid: boolean }>; reset: () => void } | null>(null);
const oldPassword = ref("");
const newPassword = ref("");
const showPass = ref(false);
const busy = ref(false);

watch(show, (open) => {
  if (open) {
    oldPassword.value = "";
    newPassword.value = "";
    showPass.value = false;
  }
});

const required = (value: string) => !!value || t("misc.Required");

async function save() {
  if (busy.value || !(await form.value?.validate())?.valid) return;
  busy.value = true;
  try {
    await users.update({
      id: props.userId,
      old_password: oldPassword.value,
      password: newPassword.value
    });
    ui.notify(t("User.PasswordChanged"), "success");
    show.value = false;
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>
