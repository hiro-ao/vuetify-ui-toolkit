<script lang="ts" setup>
import { useAttrs } from 'vue';
import { VMaskInput } from 'vuetify/labs/VMaskInput';

const model = defineModel<string>({ default: '' });
const attrs = useAttrs();
</script>

<template>
  <VMaskInput
    v-bind="attrs"
    v-model="model"
    mask="###-####"
    v-ascii
    width="115"
  />
</template>
