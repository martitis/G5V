<template>
  <v-container class="season" fluid>
    <v-card>
      <v-row>
        <v-col cols="12">
          <v-card-title
            v-if="seasonData.start_date != null && seasonData.end_date != null"
          >
            {{ seasonData.name }}
            <v-spacer />
            {{ isStarted }}:
            {{ new Date(seasonData.start_date).toLocaleDateString() }}
            <br />
            {{ isEnding }}:
            {{ new Date(seasonData.end_date).toLocaleDateString() }}
          </v-card-title>
          <v-card-title
            v-else-if="
              seasonData.start_date != null && seasonData.end_date == null
            "
          >
            {{ seasonData.name }}
            <v-spacer />
            {{ isStarted }}:
            {{ new Date(seasonData.start_date).toLocaleDateString() }}
          </v-card-title>
          <v-card-title v-else>
            {{ seasonData.name }}
          </v-card-title>
          <v-card-title>
            <v-btn :to="`/leaderboard/${seasonData.id}`">
              {{ $t("misc.PLeader") }}
            </v-btn>
            <v-btn :to="`/leaderboard/teams/${seasonData.id}`">
              {{ $t("Leaderboard.TTitle") }}
            </v-btn>
          </v-card-title>
        </v-col>
        <v-col cols="12">
          <MatchesTable :user="user" />
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
// @ is an alias to /src
import MatchesTable from "@/components/MatchesTableNoLimits";
export default {
  name: "Season",
  components: {
    MatchesTable
  },
  data() {
    return {
      user: {
        admin: false,
        steam_id: "",
        id: -1,
        super_admin: false,
        name: "",
        small_image: "",
        medium_image: "",
        large_image: ""
      }, // should be object from JSON response
      seasonData: {
        name: "",
        id: -1,
        user_id: -1,
        start_date: null,
        end_date: null
      }
    };
  },
  async created() {
    this.user = await this.IsLoggedIn();
    this.seasonData = await this.GetSeasonInfo(this.$route.params.id);
    this.seasonData.start_date = new Date(this.seasonData.start_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    if (this.seasonData.end_date != null)
      this.seasonData.end_date = new Date(this.seasonData.end_date)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
  },
  computed: {
    isStarted() {
      if (
        this.seasonData.start_date >=
        new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ")
      )
        return "Starting";
      else return "Started";
    },
    isEnding() {
      if (
        this.seasonData.end_date != null &&
        this.seasonData.end_date <
          new Date()
            .toISOString()
            .slice(0, 19)
            .replace("T", " ")
      )
        return "Ended";
      else return "Ends";
    }
  }
};
</script>
