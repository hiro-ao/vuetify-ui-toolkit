import type { App, Component } from 'vue';
import UiBtn from './components/ui/Btn.vue';
import UiForm from './components/ui/Form.vue';
import UiFormField from './components/ui/form/Field.vue';
import UiFormPasswordField from './components/ui/form/PasswordField.vue';
import UiFormPostcodeField from './components/ui/form/PostcodeField.vue';
import UiFormValidationMessages from './components/ui/form/ValidationMessages.vue';
import UiTabs from './components/ui/Tabs.vue';
import { asciiDirective } from './directives/ascii';

export {
  asciiDirective,
  UiBtn,
  UiForm,
  UiFormField,
  UiFormPasswordField,
  UiFormPostcodeField,
  UiFormValidationMessages,
  UiTabs,
};

const components: [string, Component][] = [
  ['UiBtn', UiBtn],
  ['UiTabs', UiTabs],
  ['UiForm', UiForm],
  ['UiFormField', UiFormField],
  ['UiFormPasswordField', UiFormPasswordField],
  ['UiFormPostcodeField', UiFormPostcodeField],
  ['UiFormValidationMessages', UiFormValidationMessages],
];

export const VuetifyUiToolkit = {
  install(app: App) {
    for (const [name, component] of components) {
      app.component(name, component);
    }
    app.directive('ascii', asciiDirective);
  },
};

export { useApiForm } from './composables/useApiForm';
export type {
  ApiFormErrors,
  ApiFormOptions,
  ApiFormRequestOptions,
} from './composables/useApiForm';
export { createForm, FormKey, useForm } from './composables/useForm';
export type { CreateFormOptions } from './composables/useForm';
export { useFormConfigs } from './composables/useFormConfigs';
export { useValidation } from './composables/useValidation';
export type {
  FormFieldConfig,
  FormFieldSchema,
  FormValue,
} from './composables/useFormConfigs';
export type {
  ValidationMessage,
  ValidationMessages,
  ValidationOption,
  ValidationRule,
  ValidationRules,
  ValidationTrigger,
} from './composables/useValidation';
