<script lang="ts" setup>
import { ref } from 'vue';
import { VTextField } from 'vuetify/components';

const visible = ref(false);
</script>

<template>
  <v-text-field
    v-bind="$attrs"
    :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
    :type="visible ? 'text' : 'password'"
    @click:append-inner="visible = !visible"
  />
</template>
