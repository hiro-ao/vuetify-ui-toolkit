<script lang="ts" setup>
import { computed, useAttrs } from 'vue';

const model = defineModel<string>({ default: '' });
const attrs = useAttrs();

const formattedValue = computed(() => {
  const digits = model.value.replace(/\D/g, '').slice(0, 7);
  return digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
});

const updateValue = (value: unknown) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 7);
  model.value = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
};
</script>

<template>
  <v-text-field
    v-bind="attrs"
    :model-value="formattedValue"
    inputmode="numeric"
    maxlength="8"
    @update:model-value="updateValue"
  />
</template>
