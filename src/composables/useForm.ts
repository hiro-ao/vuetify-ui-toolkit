import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';

interface FormItem {
  id: string;
  validate: () => Promise<string[]>;
  resetValidation: () => void;
  isValid: boolean | null;
}

interface FormContext {
  register: (item: Omit<FormItem, 'isValid'>) => void;
  unregister: (id: string) => void;
  update: (id: string, isValid: boolean, errorMessages?: string[]) => void;
  isReadonly: ComputedRef<boolean>;
  isValidating: ReturnType<typeof ref<boolean>>;
  items: ReturnType<typeof ref<FormItem[]>>;
}

export interface CreateFormOptions {
  fastFail?: boolean;
  isReadonly?: MaybeRefOrGetter<boolean>;
}

export const FormKey: InjectionKey<FormContext> = Symbol.for('ui:form') as InjectionKey<FormContext>;

export const createForm = (props: CreateFormOptions = {}) => {
  const items = ref<FormItem[]>([]);
  const isValidating = ref(false);
  const isReadonly = computed(() => toValue(props.isReadonly ?? false));

  async function validate() {
    const results: { id: string }[] = [];
    let valid = true;
    isValidating.value = true;
    try {
      for (const item of items.value) {
        const itemErrorMessages = await item.validate();
        if (itemErrorMessages.length > 0) {
          valid = false;
          results.push({ id: item.id });
        }
        if (!valid && props.fastFail) break;
      }
    } finally {
      isValidating.value = false;
    }
    // errors.value = results;
    return {
      valid,
      // errors: errors.value,
    };
  }
  function resetValidation() {
    for (const item of items.value) item.resetValidation();
  }

  provide(FormKey, {
    register: ({ id, validate, resetValidation }) => {
      if (items.value.some((item) => item.id === id)) {
        console.warn(`Duplicate input name "${id}"`);
      }
      items.value.push({
        id,
        validate,
        resetValidation,
        isValid: null,
      });
    },
    unregister: (id) => {
      items.value = items.value.filter((item) => {
        return item.id !== id;
      });
    },
    update: (id, isValid) => {
      const found = items.value.find((item) => item.id === id);
      if (!found) return;
      found.isValid = isValid;
    },
    isReadonly,
    isValidating,
    items,
  });
  return {
    isReadonly,
    isValidating,
    items,
    validate,
    resetValidation,
  };
};

export function useForm(): FormContext | null {
  return inject(FormKey, null);
}
