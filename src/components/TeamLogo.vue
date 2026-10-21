<template>
  <img
    v-if="logo && !failed"
    :src="logoUrl(logo, ext)"
    :width="size"
    :height="size"
    alt=""
    style="object-fit: contain"
    @error="onError"
  />
  <v-icon v-else-if="placeholder" :size="size" color="grey">mdi-shield-outline</v-icon>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { logoUrl } from "@/utils/format";

const props = withDefaults(defineProps<{ logo?: string | null; size?: number; placeholder?: boolean }>(), {
  logo: null,
  size: 32,
  placeholder: false
});

const ext = ref<"png" | "svg">("png");
const failed = ref(false);
watch(
  () => props.logo,
  () => {
    ext.value = "png";
    failed.value = false;
  }
);

// Logos are stored as either .png or .svg; try the PNG first.
function onError() {
  if (ext.value === "png") ext.value = "svg";
  else failed.value = true;
}
</script>
