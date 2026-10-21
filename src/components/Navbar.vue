<template>
  <v-card>
    <v-system-bar color="primary darken-3"></v-system-bar>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon v-if="!isWide" @click.stop="drawer = !drawer" />
      <v-toolbar-title>{{ $t("Navbar.title") }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn rounded :href="apiUrl + '/auth/steam'" v-if="loggedOut">
        <img src="/img/login_small.png" v-if="loggedOut" />
      </v-btn>
      <v-tooltip v-if="loggedIn" bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            rounded
            fab
            small
            color="grey darken-2"
            @click="logout"
            v-if="loggedIn"
          >
            <v-icon>mdi-logout-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Navbar.Logout") }}</span>
      </v-tooltip>
      <v-tooltip v-else bottom>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            rounded
            fab
            small
            color="grey darken-2"
            @click="loginDialog = true"
            v-if="loggedOut"
          >
            <v-icon>mdi-login-variant</v-icon>
          </v-btn>
        </template>
        <span>{{ $t("Login.title") }}</span>
      </v-tooltip>
      <v-btn :to="'/user/' + user.id" v-if="loggedIn" fab small>
        <img :src="user.small_image" style="border-radius: 15px;" />
      </v-btn>
    </v-app-bar>
    <!-- Always open on wide screens; a slide-out drawer on phones so it doesn't cover the page. -->
    <v-navigation-drawer v-model="drawer" :permanent="isWide" fixed app>
      <v-list nav>
        <v-list-item-group
          v-model="group"
          active-class="primary--text text--accent-4"
        >
          <v-list-item index="Home" :to="'/'">
            <v-list-item-title>{{ $t("Navbar.Home") }}</v-list-item-title>
          </v-list-item>

          <v-list-item index="Matches" :to="'/matches'">
            <v-list-item-title>{{ $t("Navbar.AllMatches") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" index="mymatches" :to="'/mymatches'">
            <v-list-item-title>{{ $t("Navbar.MyMatches") }}</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="loggedIn"
            index="match_create"
            :to="'/match/create'"
          >
            <v-list-item-title>{{
              $t("Navbar.CreateMatch")
            }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" :to="'/myteams'">
            <v-list-item-title>{{ $t("Navbar.MyTeams") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/teams'" exact>
            <v-list-item-title>{{ $t("Navbar.AllTeams") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" :to="'/teams/create'" exact>
            <v-list-item-title>{{ $t("Navbar.CreateTeam") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" :to="'/myservers'">
            <v-list-item-title>{{ $t("Navbar.MyServers") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" @click="newDialog = true">
            <v-list-item-title>{{ $t("Navbar.AddServer") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/seasons'">
            <v-list-item-title>{{ $t("Navbar.AllSeasons") }}</v-list-item-title>
          </v-list-item>

          <v-list-item v-if="loggedIn" :to="'/myseasons'">
            <v-list-item-title>{{ $t("Navbar.MySeasons") }}</v-list-item-title>
          </v-list-item>

          <v-list-item :to="'/leaderboard'">
            <v-list-item-title>
              {{ $t("Navbar.PlayerLeader") }}
            </v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <ServerDialog
      v-model="newDialog"
      :serverInfo="{}"
      :title="$t('MyServers.New')"
    />
    <LoginDialog v-model="loginDialog" :title="$t('Login.title')" />
  </v-card>
</template>
<script>
import ServerDialog from "./ServerDialog";
import LoginDialog from "./LoginDialog";
export default {
  name: "Navbar",
  props: {
    user: Object
  },
  components: {
    ServerDialog,
    LoginDialog
  },
  data() {
    return {
      drawer: false,
      group: null,
      newDialog: false,
      loginDialog: false,
      apiUrl: process.env?.VUE_APP_G5V_API_URL || "/api"
    };
  },
  computed: {
    isWide() {
      return this.$vuetify.breakpoint.mdAndUp;
    },
    // id is -1 while the login check is still running, null when logged out.
    loggedIn() {
      return this.user?.id != null && this.user.id !== -1;
    },
    loggedOut() {
      return this.user?.id == null;
    }
  },
  watch: {
    group() {
      // Close the drawer after navigating, on phones only.
      if (!this.isWide) this.drawer = false;
    }
  },
  methods: {
    async logout() {
      await this.Logout();
      // Full reload so every component drops the old user.
      window.location.assign(process.env.BASE_URL || "/");
    }
  }
};
</script>
