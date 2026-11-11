import {
  computed,
  onScopeDispose,
  ref,
  toRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';

export type ValidationTrigger = 'blur' | 'debounce';

export interface ValidationOption {
  trigger?: ValidationTrigger;
  debounceMs?: number;
}

type ValidationFunction = {
  bivarianceHack(value: unknown, formValues: unknown): boolean | Promise<boolean>;
}['bivarianceHack'];

export type ValidationRule = {
  validate: ValidationFunction;
  message: string;
  successMessage?: string;
  hidden?: boolean;
  trigger?: ValidationTrigger;
  debounceMs?: number;
  isAsync?: boolean;
  isPrecognition?: boolean;
};

export type ValidationRules = Record<string, ValidationRule>;

type ValidationMessageState =
  | 'default' // チェック前
  | 'checking' // 非同期チェック中
  | 'error' // チェック後不合格
  | 'success' // チェック後合格
  | 'hidden'; // チェック前に非表示

export type ValidationMessage = {
  state: ValidationMessageState;
  message: string;
  showOnSuccess?: boolean;
};

export type ValidationMessages = Record<string, ValidationMessage>;

interface UseValidationProps {
  modelValue: unknown;
  isPrecognitionRequesting?: boolean;
}
type Validates = Record<string, boolean | undefined>;

const isEmptyValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

export function useValidation(
  props: UseValidationProps,
  rules: MaybeRefOrGetter<ValidationRules>,
  formValues?: Ref<Record<string, unknown>>,
  serverErrors?: Ref<string | string[] | undefined>,
) {
  const modelValueRef = toRef(props, 'modelValue');
  const initialValue = modelValueRef.value;
  const validates = ref<Validates>({});
  const checking = ref<Record<string, boolean>>({});
  const validationTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const validationRequests = new Map<string, number>();

  watch(modelValueRef, () => {
    const currentServerErrors = serverErrors?.value;
    if (Array.isArray(currentServerErrors)) {
      currentServerErrors.length = 0;
    }

    validationTimers.forEach((timer, key) => {
      clearTimeout(timer);
      validationTimers.delete(key);
    });

    const currentRules = toValue(rules);
    for (const [key, rule] of Object.entries(currentRules)) {
      if (!rule.isAsync) continue;
      validationRequests.set(key, (validationRequests.get(key) ?? 0) + 1);
      validates.value[key] = undefined;
      checking.value[key] = false;

      if (rule.trigger === 'debounce') {
        const timer = setTimeout(() => {
          validationTimers.delete(key);
          void runAsyncValidation(key);
        }, rule.debounceMs ?? 3000);
        validationTimers.set(key, timer);
      }
    }
  });

  onScopeDispose(() => {
    for (const timer of validationTimers.values()) {
      clearTimeout(timer);
    }
  });

  const isDirty = computed(() => modelValueRef.value !== initialValue);

  const isEmpty = computed(() => {
    const val = modelValueRef.value;
    if (val === null || val === undefined) return true;
    if (typeof val === 'string' && val.trim() === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    return false;
  });

  const isValid = computed(() => {
    if (props.isPrecognitionRequesting) return false;
    if (Object.values(checking.value).some(Boolean)) return false;
    return Object.values(validates.value)
      .filter((result): result is boolean => result !== undefined)
      .every(Boolean);
  });

  const messages = computed(() => {
    const results: ValidationMessages = {};
    const currentRules = toValue(rules);

    for (const [key, rule] of Object.entries(currentRules)) {
      const isPristine =
        (isEmpty.value && validates.value[key] === undefined) ||
        (!rule.isPrecognition && rule.isAsync && validates.value[key] === undefined);
      const isValid = validates.value[key] ?? true;
      let isChecking = checking.value[key] ?? false;
      if (rule.isPrecognition) {
        isChecking = props.isPrecognitionRequesting === true;
      }

      if (
        !isChecking &&
        rule.hidden &&
        (isPristine || (isValid && rule.successMessage === undefined))
      ) continue;

      let state: ValidationMessageState;
      if (isChecking) {
        state = 'checking';
      } else if (isPristine) {
        state = 'default';
      } else if (isValid) {
        state = 'success';
      } else {
        state = 'error';
      }

      let message = rule.message || '';
      if (isChecking) {
        message = 'チェック中...';
      } else if (state === 'success') {
        message = rule.successMessage ?? message;
      }

      results[key] = {
        state,
        message,
        showOnSuccess: rule.successMessage !== undefined,
      };
    }

    const serverErrorValue = toValue(serverErrors);
    let currentServerErrors: string[] = [];
    if (Array.isArray(serverErrorValue)) {
      currentServerErrors = serverErrorValue;
    } else if (serverErrorValue) {
      currentServerErrors = [serverErrorValue];
    }
    for (const [index, errorMessage] of currentServerErrors.entries()) {
      const isDuplicate = Object.values(results).some(
        (result) => result.message === errorMessage,
      );
      if (isDuplicate) continue;

      results[`server-${index}`] = {
        state: 'error',
        message: errorMessage,
      };
    }

    return results;
  });

  async function runAsyncValidation(key: string) {
    const rule = toValue(rules)[key];
    if (rule?.isAsync !== true) return;
    if (rule.isPrecognition) return;

    const requestId = (validationRequests.get(key) ?? 0) + 1;
    validationRequests.set(key, requestId);
    const value = modelValueRef.value;
    if (isEmptyValue(value)) {
      validates.value[key] = undefined;
      checking.value[key] = false;
      return;
    }

    checking.value[key] = true;

    try {
      const result = await rule.validate(value, formValues?.value || {});
      if (validationRequests.get(key) !== requestId) return;
      validates.value[key] = result;
    } catch (error) {
      if (validationRequests.get(key) !== requestId) return;
      console.error(`Async validation "${key}" failed`, error);
      validates.value[key] = false;
    } finally {
      if (validationRequests.get(key) === requestId) {
        checking.value[key] = false;
      }
    }
  }

  const validateOnBlur = async () => {
    const validations = Object.entries(toValue(rules))
      .filter(
        ([, rule]) =>
          rule.isAsync &&
          !rule.isPrecognition &&
          (rule.trigger ?? 'blur') === 'blur',
      )
      .map(([key]) => runAsyncValidation(key));
    await Promise.all(validations);
  };

  const validateField = async (value: unknown): Promise<true | string> => {
    const currentRules = toValue(rules);
    const syncRules = Object.entries(currentRules).filter(
      ([, rule]) => !rule.isAsync,
    );

    const results = await Promise.all(
      syncRules.map(async ([key, rule]) => {
        const result = await rule.validate(value, formValues?.value || {});
        validates.value[key] = result;
        return result;
      }),
    );

    return results.every(Boolean) || 'error';
  };

  const vuetifyRules = [async (value: unknown) => await validateField(value)];

  return {
    messages,
    vuetifyRules,
    isValid,
    isDirty,
    validateOnBlur,
  };
}
