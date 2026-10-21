<template>
  <v-container class="vetoInfo" fluid v-if="vetoInfo.length > 0">
    <v-data-table
      :headers="headers"
      :items="vetoInfo"
      class="elevation-1"
      :sort-by="['id']"
      hide-default-footer
      :no-data-text="$t('Veto.NoData')"
      :expanded.sync="expanded"
      show-expand
    >
      <template v-slot:item.map="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          {{ item.map }}
        </b>
        <div v-else>
          {{ item.map }}
        </div>
      </template>
      <template v-slot:item.pick_or_veto="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          {{ $t("Veto.VetoPick") }}
        </b>
        <div
          v-else-if="
            item.pick_or_veto === 'ban' || item.pick_or_veto === 'veto'
          "
        >
          {{ $t("Veto.VetoBan") }}
        </div>
      </template>
      <template v-slot:item.team_name="{ item }">
        <b v-if="item.pick_or_veto === 'pick'">
          <div v-if="item.team_name === 'Decider'">
            {{ $t("Veto.DeciderTeam") }}
          </div>
          <div v-else>
            {{ item.team_name }}
          </div>
        </b>
        <div v-else>
          {{ item.team_name }}
        </div>
      </template>

      <template
        v-slot:[`item.data-table-expand`]="{ item, isExpanded, expand }"
      >
        <v-icon
          v-if="item.side"
          :class="[
            'v-data-table__expand-icon',
            { 'v-data-table__expand-icon--active': isExpanded }
          ]"
          @click.stop="expand(!isExpanded)"
          >$expand</v-icon
        >
      </template>

      <template v-slot:expanded-item="{ item, headers }">
        <td :colspan="headers.length">
          <v-data-table
            item-key="id"
            class="elevation-1"
            :headers="additionalHeaders"
            hide-default-footer
            dense
            :key="item.id"
            :items="[item]"
            disable-sort
            :colspan="headers.length"
          />
        </td>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  props: {
    match_id: Number
  },
  sse: {
    cleanup: true
  },
  data() {
    return {
      vetoInfo: [],
      expanded: []
    };
  },
  mounted() {
    this.useStreamOrStaticData();
  },
  methods: {
    async useStreamOrStaticData() {
      // Template will contain v-rows/etc like on main Team page.
      let matchData = await this.GetMatchData(this.match_id);
      if (matchData.end_time == null) this.getStreamedVetoInfo();
      else this.getVetoInfo();
    },
    async getStreamedVetoInfo() {
      try {
        // Per component (they used to be module-level and shared by every instance).
        const vetoInformation = await this.GetStreamedVetoesOfMatch(
          this.match_id
        );
        const vetoSideInformation = await this.GetStreamedVetoSidesOfMatch(
          this.match_id
        );
        await vetoInformation.on("vetodata", this.handleVetoInfo).connect();
        await vetoSideInformation
          .on("vetosidedata", this.handleLiveSideInfo)
          .connect();
      } catch (err) {
        console.error(`Error on SSE ${err}`);
      }
    },
    handleVetoInfo(liveVetoInfo) {
      if (!Array.isArray(liveVetoInfo)) return;
      liveVetoInfo.forEach(vetoData => {
        let isFound = this.vetoInfo.find(tmp => {
          return tmp["id"] === vetoData.id;
        });
        if (!isFound) {
          this.vetoInfo.push({
            id: vetoData.id,
            match_id: vetoData.match_id,
            team_name: vetoData.team_name,
            map: vetoData.map,
            pick_or_veto: vetoData.pick_or_veto
          });
        }
      });
    },
    handleLiveSideInfo(liveSideInfo) {
      if (!Array.isArray(liveSideInfo)) return;
      liveSideInfo.forEach(liveVetoData => {
        const idx = this.vetoInfo.findIndex(
          vetoData => vetoData.id === liveVetoData.veto_id
        );
        // Update the row in place so the order stays the order of the veto.
        if (idx >= 0) {
          this.$set(this.vetoInfo, idx, {
            ...this.vetoInfo[idx],
            team_name_side: liveVetoData.team_name,
            side: liveVetoData.side
          });
        }
      });
    },
    async getVetoInfo() {
      try {
        let vetoRes = await this.GetVetoesOfMatch(this.match_id);
        if (typeof vetoRes != "string") this.vetoInfo = vetoRes;
      } catch (error) {
        console.log(error);
      }
    },
    collapseAll: function() {
      this.expanded = [];
    }
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t("Veto.TeamHeader"),
          sortable: false,
          align: "start",
          value: "team_name"
        },
        {
          text: this.$t("Veto.MapHeader"),
          sortable: false,
          value: "map"
        },
        {
          text: this.$t("Veto.PickBan"),
          sortable: false,
          value: "pick_or_veto"
        },
        {
          text: "",
          value: "data-table-expand"
        }
      ];
    },
    additionalHeaders() {
      return [
        {
          text: this.$t("Veto.TeamHeader"),
          value: "team_name_side"
        },
        {
          text: this.$t("Veto.MapHeader"),
          sortable: false,
          value: "map"
        },
        {
          text: this.$t("Veto.SidePick"),
          sortable: false,
          value: "side"
        }
      ];
    }
  }
};
</script>
