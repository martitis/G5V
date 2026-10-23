<template>
  <v-dialog v-model="show" max-width="960" scrollable :fullscreen="smAndDown" persistent>
    <v-card :title="team ? $t('Team.Edit') : $t('Navbar.CreateTeam')">
      <v-card-text>
        <v-form ref="form" @submit.prevent="save">
          <v-row density="compact">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="draft.name"
                :label="$t('Team.NameLabel')"
                :rules="[required, maxLength(40, $t('Team.Name'))]"
                counter="40"
                autofocus
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
                density="compact"
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

          <v-divider class="my-4" />
          <MemberEditor v-model="members" />
          <v-alert type="info" variant="tonal" density="compact" class="mt-3">
            {{ $t("Team.WhatIsCaptain") }}
          </v-alert>
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
import { useDisplay } from "vuetify";
import { teams } from "@/api";
import type { Team } from "@/api/types";
import TeamLogo from "@/components/TeamLogo.vue";
import MemberEditor from "@/components/team/MemberEditor.vue";
import type { MemberRow } from "@/components/team/memberRow";
import { useUiStore } from "@/stores/ui";
import { FLAGS, flagUrl } from "@/utils/format";
import { prepareLogo } from "@/utils/image";

const show = defineModel<boolean>({ default: false });
/** The team to edit (with its members), or null to create one. */
const props = defineProps<{ team: Team | null }>();
const emit = defineEmits<{ saved: [id: number] }>();

const { t } = useI18n();
const ui = useUiStore();
const { smAndDown } = useDisplay();
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const busy = ref(false);
const logoFile = ref<string | null>(null);
const logoError = ref("");
const draft = reactive({ name: "", tag: "", flag: null as string | null, public: false });
const members = ref<MemberRow[]>([]);
/** Steam IDs the team had when the dialog opened (to delete the ones removed). */
let originalIds: string[] = [];

watch(show, (open) => {
  if (!open) return;
  const team = props.team;
  Object.assign(draft, {
    name: team?.name ?? "",
    tag: team?.tag ?? t("Team.NewTag"),
    flag: team?.flag ? team.flag.toUpperCase() : null,
    public: Boolean(team?.public_team)
  });
  logoFile.value = null;
  logoError.value = "";
  members.value = Object.entries(team?.auth_name ?? {}).map(([steamId, member], index) => ({
    key: -1 - index,
    input: steamId,
    steamId,
    // The API fills an empty nickname with the Steam name, so the two can't be told apart here.
    steamName: member.name || null,
    image: member.image ?? null,
    nickname: member.name ?? "",
    captain: Boolean(member.captain),
    coach: Boolean(member.coach),
    state: "ok"
  }));
  originalIds = members.value.map((row) => row.steamId as string);
});

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
  if (members.value.some((row) => row.state === "resolving")) {
    ui.notify(t("Team.WaitResolving"), "warning");
    return;
  }
  if (members.value.some((row) => row.state === "invalid")) {
    ui.notify(t("Team.FixMembers"), "warning");
    return;
  }
  busy.value = true;
  try {
    const authName = Object.fromEntries(
      members.value.map((row) => [
        row.steamId as string,
        { name: row.nickname.trim(), captain: row.captain ? 1 : 0, coach: row.coach ? 1 : 0 }
      ])
    );
    const body = {
      name: draft.name.trim(),
      tag: draft.tag.trim(),
      // "" clears the flag (null would be ignored by the update).
      flag: draft.flag ?? "",
      public_team: draft.public ? 1 : 0,
      logo_file: logoFile.value ?? undefined,
      auth_name: authName
    };
    let id: number;
    if (props.team) {
      id = props.team.id;
      await teams.update({ ...body, id });
      const kept = new Set(members.value.map((row) => row.steamId));
      for (const steamId of originalIds.filter((steamId) => !kept.has(steamId))) {
        await teams.remove({ team_id: id, steam_id: steamId });
      }
    } else {
      id = (await teams.create(body)).id;
    }
    ui.notify(t("Team.Saved"), "success");
    show.value = false;
    emit("saved", id);
  } catch (error) {
    // The dialog stays open with everything entered.
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>
