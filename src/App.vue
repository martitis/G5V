<template>
  <v-app>
    <AppNavbar />
    <v-main>
      <!-- Keyed by path so pages reload their data when only the route params change. -->
      <router-view :key="route.fullPath" />
    </v-main>
    <AppFooter />
    <v-snackbar v-model="ui.noticeShown" :color="ui.noticeColor" timeout="6000" location="bottom">
      {{ ui.notice }}
      <template #actions>
        <v-btn variant="text" @click="ui.noticeShown = false">{{ $t("misc.Close") }}</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import AppNavbar from "@/components/AppNavbar.vue";
import AppFooter from "@/components/AppFooter.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

onMounted(() => auth.load());
</script>
