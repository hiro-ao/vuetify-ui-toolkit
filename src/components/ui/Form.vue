<script setup lang="ts">
import { computed, onScopeDispose, provide, ref, watch } from 'vue';
import { VForm } from 'vuetify/components';
import type { FormFieldConfig, FormFieldSchema, FormValue } from '../../composables/useFormConfigs';
import { useFormConfigs } from '../../composables/useFormConfigs';
import UiBtn from './Btn.vue';
import UiFormField from './form/Field.vue';

const props = withDefaults(
  defineProps<{
    schema?: Record<string, FormFieldSchema>;
    submitEndpoint: string;
    serverErrors: Record<string, string | string[]>;
    onPrecognition?: (payload: { field: string; data: Record<string, FormValue> }) => Promise<void> | void;
    onSubmit?: (data: Record<string, FormValue>) => Promise<void> | void;
  }>(),
  {
    schema: () => ({}),
    serverErrors: () => ({}),
    onPrecognition: () => () => {},
    onSubmit: () => () => {},
  },
);

const emit = defineEmits<{
  submit: [data: Record<string, FormValue>];
  precognition: [{ field: string; data: Record<string, FormValue> }];
}>();

const normalizedSchema = computed(
  () => useFormConfigs(props.schema ?? {}).fieldsSchema,
);

const createInitialModel = (schema: Record<string, FormFieldConfig>) => {
  const model: Record<string, FormValue> = {};
  for (const [key, field] of Object.entries(schema)) {
    model[key] = field.defaultValue ?? '';
  }
  return model;
};

const formData = ref<Record<string, FormValue>>(
  createInitialModel(normalizedSchema.value),
);
const isValid = ref(false);
const precognitionRequestingFields = ref<Record<string, boolean>>({});
const precognitionTimers = new Map<string, ReturnType<typeof setTimeout>>();
const precognitionRequestIds = new Map<string, number>();

watch(normalizedSchema, (newSchema) => {
  const nextFormData = createInitialModel(newSchema);
  for (const key of Object.keys(nextFormData)) {
    if (key in formData.value) {
      nextFormData[key] = formData.value[key];
    }
  }
  formData.value = nextFormData;
}, { deep: true });

provide('formData', formData);

const handlePrecognition = async (key: string) => {
  const field = normalizedSchema.value[key];

  if (!field || !field.isPrecognition) return;

  const requestId = (precognitionRequestIds.get(key) ?? 0) + 1;
  precognitionRequestIds.set(key, requestId);
  precognitionRequestingFields.value[key] = true;

  try {
    await props.onPrecognition({
      field: key,
      data: formData.value,
    });
  } finally {
    if (precognitionRequestIds.get(key) === requestId) {
      precognitionRequestingFields.value[key] = false;
    }
  }
};

const handleFieldBlur = (key: string) => {
  const option = normalizedSchema.value[key]?.syncOption?.precognition;
  if ((option?.trigger ?? 'blur') === 'blur') {
    void handlePrecognition(key);
  }
};

const handleFieldInput = (key: string) => {
  const option = normalizedSchema.value[key]?.syncOption?.precognition;
  if (!normalizedSchema.value[key]?.isPrecognition || option?.trigger !== 'debounce') return;

  const currentTimer = precognitionTimers.get(key);
  if (currentTimer) clearTimeout(currentTimer);

  const timer = setTimeout(() => {
    precognitionTimers.delete(key);
    void handlePrecognition(key);
  }, option.debounceMs ?? 3000);
  precognitionTimers.set(key, timer);
};

onScopeDispose(() => {
  for (const timer of precognitionTimers.values()) {
    clearTimeout(timer);
  }
});

const handleSubmit = () => {
  emit('submit', formData.value);
};

const getUiFormFieldBindProps = (key: string, field: FormFieldConfig) => {
  return {
    name: key,
    modelValue: formData.value[key],
    'onUpdate:modelValue': (value: FormValue) => {
      formData.value[key] = value;
      handleFieldInput(key);
    },
    label: field.label,
    example: field.example,
    helperMessage: field.helperMessage,
    autocomplete: field.autoComplete,
    placeholder: field.placeholder,
    type: field.type,
    items: field.items,
    rules: field.rules,
    syncOption: field.syncOption,
    serverErrors: props.serverErrors?.[key],
    isPrecognitionRequesting: precognitionRequestingFields?.value?.[key],
    onBlur: () => handleFieldBlur(key),
  };
};
</script>

<template>
  <v-form
    v-model="isValid"
    validate-on="lazy"
    @submit.prevent>

    <slot
      :is-valid="isValid"
      :is-sending="false"
      :errors="[]"
      :validate="() => {}"
      :form-data="formData"
      :handle-submit="handleSubmit"
      :handle-submit-precognition="() => {}"
    >

      <div class="d-flex flex-column ga-4">
        <template v-for="(field, key) in normalizedSchema" :key="key">
          <slot :name="`field-${key}`" v-bind="getUiFormFieldBindProps(key, field)">
            <UiFormField v-bind="getUiFormFieldBindProps(key, field)" />
          </slot>
        </template>

        <UiBtn
          variant="accept"
          @click="handleSubmit"
        >
          送信する
        </UiBtn>
      </div>
    </slot>
  </v-form>
</template>
