<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-empty-state
      icon="mdi-map-marker-question"
      :title="$t('misc.NotFoundTitle')"
      :text="$t('misc.NotFoundText')"
    >
      <template #actions>
        <v-btn color="primary" to="/">{{ $t("Navbar.Home") }}</v-btn>
      </template>
    </v-empty-state>
  </v-container>
</template>
