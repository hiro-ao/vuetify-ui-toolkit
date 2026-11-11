<script lang="ts" setup>
import {
  computed,
  inject,
  ref,
  toRef,
  useAttrs,
  useId,
  type Ref,
} from 'vue';

import { VSelect, VTextarea, VTextField } from 'vuetify/components';

import type {
  ValidationOption,
  ValidationRules,
} from '../../../composables/useValidation';

import { useValidation } from '../../../composables/useValidation';
import PasswordField from './PasswordField.vue';
import PostcodeField from './PostcodeField.vue';
import FormValidationMessages from './ValidationMessages.vue';

type Model =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | FileList
  | Model[];

const model = defineModel<Model>({
  default: null,
});

const props = withDefaults(
  defineProps<{
    name: string;
    modelValue: Model;
    label?: string;
    type?: string;
    example?: string;
    helperMessage?: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
    rules?: ValidationRules;
    syncOption?: Record<string, ValidationOption>;
    isPrecognitionRequesting?: boolean;
    serverErrors?: string | string[] | undefined;
  }>(),
  {
    label: undefined,
    type: 'text',
    example: undefined,
    helperMessage: undefined,
    autoComplete: undefined,
    placeholder: undefined,
    required: false,
    rules: undefined,
    syncOption: undefined,
    isPrecognitionRequesting: false,
    serverErrors: undefined,
  },
);

const attrs = useAttrs();
const emit = defineEmits(['focus', 'blur', 'input']);

defineOptions({ inheritAttrs: false });

const serverErrorsRef = toRef(props, 'serverErrors');
const formData = inject<Ref<Record<string, any>>>('formData', ref({}));

const id = useId();
const inputId = `form-field-${id}`;
const inputRef = ref(null);
const isFocused = ref(false);
const isBlured = ref(false);
const innerErrors = ref([]);

const { messages, vuetifyRules, validateOnBlur } = useValidation(
  props,
  props.rules || {},
  formData,
  serverErrorsRef,
);

// const errors = computed(() => {
//   const prentErrorMessages = props.errorMessages || [];
//   const errors = Array.isArray(prentErrorMessages)
//     ? prentErrorMessages : [prentErrorMessages];

//   // 親からのエラーがあれば追加（文字列・配列の両方に対応）
//   if (inputRef.value?.errorMessages) {
//     if (Array.isArray(inputRef.value?.errorMessages)) {
//       errors.push(...inputRef.value?.errorMessages ?? []);
//     } else {
//       errors.push(inputRef.value?.errorMessages);
//     }
//   }

//   // rulesによる内部エラーがあれば追加
//   if (innerErrors.value.length > 0) {
//     errors.push(...innerErrors.value);
//   }

//   return errors;
// });

const fieldComponent = computed(() => {
  switch (props.type) {
    case 'select': {
      return VSelect;
    }
    case 'textarea': {
      return VTextarea;
    }
    case 'postcode': {
      return PostcodeField;
    }
    case 'password': {
      return PasswordField;
    }
    default: {
      return VTextField;
    }
  }
});

const sharedArgs = computed(() => ({
  ...attrs,
  id: inputId,
  name: props.name,
  ref: inputRef,
  modelValue: model.value,
  placeholder: props.placeholder,
  autocomplete: props.autoComplete,
  // errorMessages: props.errorMessages,
  // validateOn: 'input' as const,
  rules: vuetifyRules,
  hideDetails: true,
  loading: props.isPrecognitionRequesting,
  // error: true,
  'onUpdate:modelValue': (val: Model) => {
    model.value = val;
  },
  onFocus: () => {
    isFocused.value = true;
    emit('focus');
  },
  onBlur: async () => {
    isFocused.value = false;
    isBlured.value = true;
    emit('blur');
    await validateOnBlur();
  },
  onInput: () => {
    emit('input');
  },
}));

</script>

<template>
  <div class="d-flex flex-column">
    <!-- ラベル・必須・ヒントを表示する行 -->
    <div v-if="label" class="d-flex align-center mb-1">

      <!-- 左側：ラベルと必須マーク -->
      <v-label
        v-if="label"
        :for="inputId"
        :class="[
          'text-parimary',
          'text-body-large',
          isFocused ? 'text-primary' : 'text-high-emphasis'
        ]"
      >{{ label }}</v-label>
      <!-- 必須バッジ -->
      <v-chip
        v-if="required"
        color="error"
        variant="outlined"
        rounded="md"
        size="small"
        class="ml-2"
      >必須</v-chip>

      <!-- 右側：ヒント -->
      <div class="ml-2 me-auto" />
      <div class="text-caption opacity-70 text-body-medium">
        <slot name="helper-message">
          {{ helperMessage }}
        </slot>
      </div>
    </div>

    <!-- 記入例 -->
    <div v-if="example" class="text-caption opacity-60 text-body-medium">
      記入例：{{ example }}
    </div>

    <!-- 入力フィールド -->
    <div class="form-field">
      <slot :bind-args="sharedArgs">
        <component
          :is="fieldComponent"
          v-bind="sharedArgs"
          :class="{ 'suppress-red': !isBlured }"
        />
      </slot>
    </div>

    <!-- バリデーションエラー -->
    <FormValidationMessages
      :messages="messages"
      :is-focused="isFocused"
      :is-blured="isBlured"
    />
  </div>
</template>

<style scoped>
.v-input.v-input--focused.suppress-red:deep(.v-field__outline) {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
