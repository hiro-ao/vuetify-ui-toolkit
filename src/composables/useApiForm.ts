import { ref } from 'vue';

export interface ApiFormRequestOptions {
  validateField?: string;
}

export type ApiFormErrors = Record<string, string | string[]>;

export interface ApiFormOptions<TData, TResponse> {
  request: (
    data: TData,
    options?: ApiFormRequestOptions,
  ) => Promise<TResponse>;
  getValidationErrors?: (error: unknown) => ApiFormErrors | undefined;
  onSuccess?: (response: TResponse) => void | Promise<void>;
}

export const useApiForm = <TData, TResponse>(
  options: ApiFormOptions<TData, TResponse>,
) => {
  const isSubmitting = ref(false);
  const serverErrors = ref<ApiFormErrors>({});

  const sendRequest = async (
    data: TData,
    validateField?: string,
  ): Promise<{ success: true; response: TResponse } | { success: false }> => {
    try {
      const response = await options.request(data, { validateField });

      if (validateField) {
        delete serverErrors.value[validateField];
      }

      return { success: true, response };
    } catch (error) {
      const errors = options.getValidationErrors?.(error);
      if (!errors) throw error;

      if (validateField) {
        const fieldError = errors[validateField];
        if (fieldError) {
          serverErrors.value[validateField] = fieldError;
        } else {
          delete serverErrors.value[validateField];
        }
      } else {
        serverErrors.value = errors;
      }

      return { success: false };
    }
  };

  const handlePrecognition = async ({
    field,
    data,
  }: {
    field: string;
    data: TData;
  }) => {
    await sendRequest(data, field);
  };

  const handleSubmit = async (data: TData) => {
    isSubmitting.value = true;
    serverErrors.value = {};

    try {
      const result = await sendRequest(data);
      if (result.success) {
        await options.onSuccess?.(result.response);
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    isSubmitting,
    serverErrors,
    handlePrecognition,
    handleSubmit,
  };
};
