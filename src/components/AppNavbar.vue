<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-nav-icon v-if="!mdAndUp" @click.stop="drawer = !drawer" />
    <v-app-bar-title>{{ appTitle() }}</v-app-bar-title>
    <template #append>
      <!-- Nothing until the login check has answered, so logged-in users don't see the login buttons flash. -->
      <template v-if="auth.loaded && !auth.loggedIn">
        <v-btn :href="apiUrl('/auth/steam')" class="mr-2" variant="text" rounded>
          <img :src="`${base}img/login_small.png`" alt="Sign in through Steam" />
        </v-btn>
        <v-btn icon="mdi-login-variant" variant="text" @click="loginDialog = true">
          <v-icon>mdi-login-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ $t("Login.title") }}</v-tooltip>
        </v-btn>
      </template>
      <template v-else-if="auth.loggedIn">
        <v-btn :to="`/user/${auth.user?.id}`" icon variant="text" class="mr-1">
          <v-avatar size="32" :image="auth.user?.small_image || undefined" icon="mdi-account" />
        </v-btn>
        <v-btn icon variant="text" @click="logout">
          <v-icon>mdi-logout-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ $t("Navbar.Logout") }}</v-tooltip>
        </v-btn>
      </template>
    </template>
  </v-app-bar>

  <!-- Always open on wide screens; a slide-out drawer on phones so it doesn't cover the page. -->
  <v-navigation-drawer v-model="drawer" :permanent="mdAndUp">
    <v-list nav density="comfortable" color="primary">
      <v-list-item to="/" exact :title="$t('Navbar.Home')" prepend-icon="mdi-home" />
      <v-list-item to="/matches" :title="$t('Navbar.AllMatches')" prepend-icon="mdi-sword-cross" />
      <template v-if="auth.loggedIn">
        <v-list-item
          to="/mymatches"
          :title="$t('Navbar.MyMatches')"
          prepend-icon="mdi-account-details"
        />
        <v-list-item
          v-if="auth.isAdmin"
          to="/match/create"
          :title="$t('Navbar.CreateMatch')"
          prepend-icon="mdi-plus-box"
        />
      </template>
      <v-divider class="my-2" />
      <v-list-item
        to="/teams"
        exact
        :title="$t('Navbar.AllTeams')"
        prepend-icon="mdi-account-group"
      />
      <template v-if="auth.loggedIn">
        <v-list-item
          to="/myteams"
          :title="$t('Navbar.MyTeams')"
          prepend-icon="mdi-account-multiple"
        />
        <v-list-item
          to="/teams/create"
          :title="$t('Navbar.CreateTeam')"
          prepend-icon="mdi-account-multiple-plus"
        />
      </template>
      <v-divider class="my-2" />
      <template v-if="auth.loggedIn">
        <v-list-item to="/myservers" :title="$t('Navbar.MyServers')" prepend-icon="mdi-server" />
        <v-list-item
          :title="$t('Navbar.AddServer')"
          prepend-icon="mdi-server-plus"
          @click="serverDialog = true"
        />
      </template>
      <v-list-item
        to="/tournaments"
        :title="$t('Navbar.Tournaments')"
        prepend-icon="mdi-tournament"
      />
      <v-list-item to="/seasons" :title="$t('Navbar.AllSeasons')" prepend-icon="mdi-trophy" />
      <v-list-item
        v-if="auth.loggedIn"
        to="/myseasons"
        :title="$t('Navbar.MySeasons')"
        prepend-icon="mdi-trophy-outline"
      />
      <v-divider class="my-2" />
      <v-list-item to="/leaderboard" :title="$t('Navbar.PlayerLeader')" prepend-icon="mdi-podium" />
      <template v-if="auth.isSuperAdmin">
        <v-divider class="my-2" />
        <v-list-item to="/admin" :title="$t('Navbar.Admin')" prepend-icon="mdi-shield-crown" />
      </template>
    </v-list>
  </v-navigation-drawer>

  <ServerDialog v-model="serverDialog" :server="null" @saved="onServerSaved" />
  <LoginDialog v-model="loginDialog" />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { apiUrl, appTitle } from "@/config";
import { useAuthStore } from "@/stores/auth";
import ServerDialog from "@/components/ServerDialog.vue";
import LoginDialog from "@/components/LoginDialog.vue";

const base = import.meta.env.BASE_URL;
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const drawer = ref(mdAndUp.value);
const serverDialog = ref(false);
const loginDialog = ref(false);

// On phones, close the drawer after navigating.
watch(
  () => route.fullPath,
  () => {
    if (!mdAndUp.value) drawer.value = false;
  }
);

async function logout() {
  await auth.logout();
  router.push("/");
}

function onServerSaved() {
  if (route.path === "/myservers") router.go(0);
}
</script>
