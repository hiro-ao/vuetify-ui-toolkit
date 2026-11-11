import type {
  ValidationOption,
  ValidationRules,
} from './useValidation';

type CustomValidationFunction = {
  bivarianceHack(value: unknown, formValues: unknown): boolean | Promise<boolean>;
}['bivarianceHack'];

type CustomValidation = Record<string, CustomValidationFunction>;

type ValidationPart = {
  validate?: (string | CustomValidation)[];
  validateMessage?: Record<string, string>;
  validateSuccessMessage?: Record<string, string>;
  validateHidden?: Record<string, boolean>;
  syncOption?: Record<string, FormValidationOption>;
  validate_message?: Record<string, string>;
  validate_success_message?: Record<string, string>;
  validate_hidden?: Record<string, boolean>;
  sync_option?: Record<string, FormValidationOption>;
};

export type FormFieldConfig = {
  label?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  helperMessage?: string;
  defaultValue?: FormValue;
  example?: string;
  rules?: ValidationRules;
  items?: unknown[];
  syncOption?: Record<string, FormValidationOption>;
  isPrecognition?: boolean;
};

export interface FormValidationOption extends ValidationOption {
  debounce_ms?: number;
}

export type FormFieldSchema = FormFieldConfig & ValidationPart & {
  autocomplete?: string;
  helper_message?: string;
  default_value?: FormValue;
};

type FormSchema = Record<string, FormFieldSchema>;

export type FormValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | File
  | FileList
  | FormValue[];

type FormValues = Record<string, FormValue>;

type RuleSchema = Record<string, ValidationRules>;

const isEmptyValue = (value: FormValue) =>
  value === null || value === undefined || value === '';

const addCustomValidationRules = (
  rules: ValidationRules,
  validators: CustomValidation,
  validationMessages: Record<string, string>,
  validationSuccessMessages: Record<string, string> | undefined,
  validationHidden: Record<string, boolean> | undefined,
  syncOption: Record<string, FormValidationOption> | undefined,
) => {
  for (const [ruleName, validator] of Object.entries(validators)) {
    if (typeof validator !== 'function') continue;
    const option = syncOption?.[ruleName] ?? {};
    const debounceMs = option.debounceMs ?? option.debounce_ms;
    rules[ruleName] = {
      validate: validator,
      message: validationMessages[ruleName] ?? '',
      successMessage: validationSuccessMessages?.[ruleName],
      hidden: validationHidden?.[ruleName] ?? false,
      trigger: option.trigger ?? 'blur',
      debounceMs,
      isAsync: true,
    };
  }
};

const normalizeValidationPart = (field: FormFieldSchema): ValidationPart => ({
  validate: field.validate ?? [],
  validateMessage: field.validate_message ?? field.validateMessage ?? {},
  validateSuccessMessage:
    field.validate_success_message ?? field.validateSuccessMessage,
  validateHidden: field.validate_hidden ?? field.validateHidden,
  syncOption: field.sync_option ?? field.syncOption,
});

const createRuleSchema = (config: Record<string, ValidationPart>) => {
  const schemaList: RuleSchema = {};

  for (const [key, field] of Object.entries(config)) {
    const validate = field.validate ?? [];
    const validateMessage = field.validateMessage ?? {};
    const validateSuccessMessage = field.validateSuccessMessage;
    const validateHidden = field.validateHidden;
    const syncOption = field.syncOption;

    const rules: ValidationRules = {};

    // 2. 制約の適用 (型ガードで絞り込み)
    for (const rule of validate) {
      if (typeof rule !== 'string') {
        addCustomValidationRules(
          rules,
          rule,
          validateMessage,
          validateSuccessMessage,
          validateHidden,
          syncOption,
        );
        continue;
      }

      const [action, value] = rule.split(':');
      const valueString = value ?? '';
      const valueNumber = Number.parseInt(valueString, 10);
      const message = validateMessage[rule] ?? '';

      let validator: ((value: FormValue, formValues: FormValues) => boolean) | undefined;
      switch (action) {
        case 'string':
          validator = (input) =>
            input === null ||
            input === undefined ||
            input === '' ||
            typeof input === 'string';
          break;
        case 'required': {
          validator = (input) =>
            input !== null &&
            input !== undefined &&
            (typeof input !== 'string' || input.trim().length > 0) &&
            (!Array.isArray(input) || input.length > 0);
          break;
        }
        case 'same': {
          validator = (input, formValues) => input === formValues[valueString];
          break;
        }
        case 'precognition': {
          const option = syncOption?.precognition ?? {};
          const debounceMs = option.debounceMs ?? option.debounce_ms;
          rules[rule] = {
            validate: () => true,
            message,
            trigger: option.trigger ?? 'blur',
            debounceMs,
            isAsync: true,
            isPrecognition: true,
          };
          break;
        }
        case 'min':
        case 'max':
        case 'size': {
          if (!Number.isNaN(valueNumber)) {
            validator = (input) => {
              if (isEmptyValue(input)) return true;
              const length = typeof input === 'string' || Array.isArray(input)
                ? input.length
                : typeof input === 'number'
                  ? input
                  : Number.NaN;
              if (Number.isNaN(length)) return false;
              if (action === 'min') return length >= valueNumber;
              if (action === 'max') return length <= valueNumber;
              return length === valueNumber;
            };
          }
          break;
        }
        case 'email': {
          validator = (input) =>
            isEmptyValue(input) ||
            (typeof input === 'string' && /.+@.+\..+/.test(input));
          break;
        }
        case 'postcode': {
          validator = (input) =>
            isEmptyValue(input) ||
            (typeof input === 'string' && /^\d{3}-?\d{4}$/.test(input));
          break;
        }
        case 'digits': {
          if (!Number.isNaN(valueNumber)) {
            validator = (input) => {
              if (isEmptyValue(input)) return true;
              const digits = typeof input === 'string' ? input.replace(/-/g, '') : String(input ?? '');
              return /^\d+$/.test(digits) && digits.length === valueNumber;
            };
          }
          break;
        }
        case 'numeric': {
          validator = (input) =>
            isEmptyValue(input) || Number.isFinite(Number(input));
          break;
        }
      }

      if (validator) {
        rules[rule] = {
          validate: validator,
          message,
          successMessage: validateSuccessMessage?.[rule],
          hidden: validateHidden?.[rule] ?? false,
        };
      }
    }

    schemaList[key] = rules;
  }

  return schemaList;
};

const createPrecognitionMap = (config: Record<string, ValidationPart>) => {
  const precognitionMap: Record<string, boolean> = {};

  for (const [key, field] of Object.entries(config)) {
    if (field.validate?.includes('precognition')) {
      precognitionMap[key] = true;
    }
  }

  return precognitionMap;
};

export const useFormConfigs = (formSchema: FormSchema) => {
  const validationRules: Record<string, ValidationPart> = {};
  const fieldsSchema: Record<string, FormFieldConfig> = {};

  for (const [key, field] of Object.entries(formSchema || {})) {
    const validationPart = normalizeValidationPart(field);
    validationRules[key] = validationPart;

    fieldsSchema[key] = {
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      example: field.example,
      autoComplete: field.autocomplete ?? field.autoComplete,
      helperMessage: field.helper_message ?? field.helperMessage,
      defaultValue: field.default_value ?? field.defaultValue,
      items: field.items,
      syncOption: validationPart.syncOption,
      isPrecognition: field.isPrecognition,
      rules: field.rules,
    };
  }

  // 取得したルールを元にスキーマを動的に生成
  const ruleSchema = createRuleSchema(validationRules);

  for (const [key, field] of Object.entries(fieldsSchema)) {
    if (Object.keys(ruleSchema[key] ?? {}).length > 0 || !field.rules) {
      field.rules = ruleSchema[key] ?? {};
    }
  }


  // Laravel Precognitionの対象取得
  const precognitionMap = createPrecognitionMap(validationRules);

  for (const [key] of Object.entries(precognitionMap)) {
    if (!fieldsSchema[key]) continue;
    fieldsSchema[key].isPrecognition = true;
  }
  return {
    fieldsSchema,
    precognitionMap,
  };
};
/*
from
  submitEndpoint /register

  submitHandler
  submitHandlerPrecognition

  serverErrors

inputでstatus:default
string,max:255,precognition等は入力初回時は表示しない

validate:
  email: (v) => v.test('@').   //input
{
  "label": "メールアドレス",
  "type": "email",
  "autocomplete": "email",
  "placeholder": "example@example.com",
  "helper_message": "<a href=\"/\" class=\"link link-primary\">パスワードをお忘れの方</a>",
  "default_value": "test@test.test",
  "validate": [
    "required",
    "string",
    "email",
    "max:255",
    "precognition"
  ],
  "validate_message": {
    "required": "必須項目です。",
    "string": "文字列を指定してください。",  // 除外 サーバーエラーにする
    "email": "有効なメールアドレス形式で指定してください。",
    "max:255": "文字数は、255文字以下である必要があります。", // 255は除外 サーバーエラーにする
    "precognition": "validation.precognition"
  }
}
{
  "label": "パスワード",
  "type": "password",
  "autocomplete": "new-password",
  "validate": [
    "required",
    "string",
    "confirmed",
    "min:8",
    "password:letters",
    "password:numbers",
    "password:symbols",
    "password:mixed"
  ],
  "validate_message": {
    "required": "必須項目です。",
    "string": "文字列を指定してください。",
    "confirmed": "パスワードとパスワード確認が一致しません。",
    "min:8": "文字数は、8文字以上である必要があります。",
    "password:letters": "アルファベットを1文字以上含める必要があります。",
    "password:numbers": "数字を1文字以上含める必要があります。",
    "password:symbols": "記号を1文字以上含める必要があります。",
    "password:mixed": "大文字と小文字のアルファベットをそれぞれ1文字以上含める必要があります。"
  }
}
*/
