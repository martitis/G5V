<template>
  <v-form ref="form" @submit.prevent="save">
    <v-row density="compact">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="draft.name"
          :label="$t('Team.NameLabel')"
          :rules="[required, maxLength(40, $t('Team.Name'))]"
          counter="40"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="draft.tag"
          :label="$t('Team.TeamTag')"
          :rules="[required, maxLength(40, $t('Team.TeamTag'))]"
        />
      </v-col>
      <v-col cols="9" sm="4" md="2">
        <v-select v-model="draft.flag" :items="FLAGS" :label="$t('Team.Flag')" clearable />
      </v-col>
      <v-col cols="3" sm="2" md="1" class="d-flex align-center">
        <img :src="flagUrl(draft.flag)" alt="" style="border-radius: 4px" />
      </v-col>
    </v-row>
    <v-row density="compact" class="align-center">
      <v-col cols="12" sm="4">
        <v-switch
          v-model="draft.public"
          :label="$t('TeamCreate.FormPublicTeam')"
          color="primary"
          hide-details
        />
      </v-col>
      <v-col cols="9" sm="6">
        <v-file-input
          :label="$t('TeamCreate.TeamLogo')"
          accept="image/png, image/svg+xml"
          prepend-icon="mdi-image"
          :error-messages="logoError"
          hide-details="auto"
          @update:model-value="pickLogo"
        />
      </v-col>
      <v-col cols="3" sm="2" class="d-flex justify-center">
        <img
          v-if="logoFile"
          :src="logoFile"
          width="48"
          height="48"
          alt=""
          style="object-fit: contain"
        />
        <TeamLogo v-else :logo="team?.logo" :size="48" />
      </v-col>
    </v-row>
    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn v-if="cancellable" variant="text" :disabled="busy" @click="emit('cancel')">
        {{ $t("misc.Cancel") }}
      </v-btn>
      <v-btn color="primary" type="submit" :loading="busy">{{ $t("misc.Save") }}</v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { teams } from "@/api";
import type { Team } from "@/api/types";
import TeamLogo from "@/components/TeamLogo.vue";
import { useUiStore } from "@/stores/ui";
import { FLAGS, flagUrl } from "@/utils/format";
import { prepareLogo } from "@/utils/image";

/** The team to edit, or null to create one. */
const props = defineProps<{ team: Team | null; cancellable?: boolean }>();
const emit = defineEmits<{ saved: [id: number]; cancel: [] }>();

const { t } = useI18n();
const ui = useUiStore();
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const busy = ref(false);
const logoFile = ref<string | null>(null);
const logoError = ref("");

const draft = reactive({ name: "", tag: "", flag: null as string | null, public: false });

watch(
  () => props.team,
  (team) => {
    Object.assign(draft, {
      name: team?.name ?? "",
      tag: team?.tag ?? t("Team.NewTag"),
      flag: team?.flag ? team.flag.toUpperCase() : null,
      public: Boolean(team?.public_team)
    });
    logoFile.value = null;
    logoError.value = "";
  },
  { immediate: true }
);

const required = (value: string) => !!value?.trim() || t("misc.Required");
const maxLength = (max: number, field: string) => (value: string) =>
  (value ?? "").length <= max || t("Team.CharacterLimit", [field, max]);

async function pickLogo(files: File | File[] | null) {
  const file = Array.isArray(files) ? files[0] : files;
  logoError.value = "";
  logoFile.value = null;
  if (!file) return;
  try {
    logoFile.value = await prepareLogo(file);
  } catch {
    logoError.value = t("Team.LogoInvalid");
  }
}

async function save() {
  if (busy.value || logoError.value || !(await form.value?.validate())?.valid) return;
  busy.value = true;
  try {
    const body = {
      name: draft.name.trim(),
      tag: draft.tag.trim(),
      // "" clears the flag (null would be ignored by the update).
      flag: draft.flag ?? "",
      public_team: draft.public ? 1 : 0,
      logo_file: logoFile.value ?? undefined
    };
    if (props.team) {
      await teams.update({ ...body, id: props.team.id });
      ui.notify(t("TeamCreate.MessageeEditSuccess"), "success");
      emit("saved", props.team.id);
    } else {
      const result = await teams.create(body);
      ui.notify(t("TeamCreate.MessageRegisterSuccess"), "success");
      emit("saved", result.id);
    }
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>
