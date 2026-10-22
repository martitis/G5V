<template>
  <v-container fluid>
    <OpenQueues show-empty>
      <template #actions>
        <v-btn
          v-if="auth.isAdmin"
          color="primary"
          prepend-icon="mdi-account-multiple-plus"
          :to="{ path: '/match/create', query: { mode: 'pug' } }"
        >
          {{ $t("Pug.OpenNew") }}
        </v-btn>
      </template>
    </OpenQueues>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import OpenQueues from "@/components/pug/OpenQueues.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
onMounted(() => void auth.load());
</script>
