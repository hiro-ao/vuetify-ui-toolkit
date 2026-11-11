# Vuetify UI Toolkit

再利用可能なVueコンポーネントとcomposableをまとめたライブラリーです。Vue 3とVuetify 3は利用側アプリで用意してください。

## インストール

```sh
npm install vuetify-ui-toolkit vuetify @mdi/font
```

## Playground

リポジトリをcloneした後、依存をインストールしてサンプルページを起動します。

```sh
npm install
npm run dev
```

ローカルのコンポーネントを操作できるページが `http://localhost:5173` で開きます。静的ページのビルドは `npm run build:playground` です。

Vuetifyのプラグインとスタイルをアプリに設定し、ライブラリーのスタイルを読み込みます。

```ts
import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import 'vuetify-ui-toolkit/style.css';
import { VuetifyUiToolkit } from 'vuetify-ui-toolkit';
import App from './App.vue';

createApp(App)
  .use(createVuetify({ icons: { defaultSet: 'mdi' } }))
  .use(VuetifyUiToolkit)
  .mount('#app');
```

フォームのバリデーションアイコンにはMaterial Design Iconsを使用します。利用側アプリでも`@mdi/font`をインストールし、上記のようにCSSを読み込んでVuetifyのアイコンセットを設定してください。

プラグインを使わず、必要なコンポーネントだけを登録することもできます。

```ts
import { UiBtn, UiTabs, useValidation } from 'vuetify-ui-toolkit';
```

## APIフォーム送信

`useApiForm`は通信ライブラリーに依存しません。`request`に送信処理を渡し、バックエンド固有のバリデーションエラーは`getValidationErrors`でフィールド名からエラー文字列への形式に変換します。Laravel Precognitionを使う場合は`validateField`を送信処理に反映します。Elysia Edenなどでは不要なら無視できます。Edenの`{ data, error }`形式は`request`内で`error`をthrowすることで共通処理に渡せます。

```ts
const form = useApiForm({
  request: async (data, { validateField } = {}) => {
    const response = await client('/users', {
      method: 'POST',
      body: data,
      headers: validateField
        ? {
            Precognition: 'true',
            'X-Inertia-Precognition-Validate-Only': validateField,
          }
        : undefined,
    });
    return response;
  },
  getValidationErrors: (error) => {
    // バックエンドのエラーを Record<string, string | string[]> に変換
    return extractFieldErrors(error);
  },
  onSuccess: (response) => {
    // 成功時の処理
  },
});
```

Sanctumではクライアントのthrow形式を使い、Edenでは戻り値の`error`をthrowするようにします。`getValidationErrors`はそれぞれのAPIが返す422エラーを`ApiFormErrors`形式に変換する関数です。

`request`が失敗し、`getValidationErrors`が`undefined`を返すエラーは`handleSubmit`から呼び出し元へ伝播します。

## フォームスキーマ

`UiForm`はsnake_caseのフォーム設定を受け取り、フィールドごとに独立したバリデーションルールへ変換します。`validate_hidden`と`sync_option`は対象フィールド・ルールにのみ適用されます。

```ts
const schema = {
  name: {
    label: '名前',
    type: 'text',
    autocomplete: 'name',
    helper_message: '2文字以上で入力してください',
    default_value: '',
    validate: [
      'required',
      'max:255',
      {
        available: async (value: string) => value.length >= 2,
      },
    ],
    validate_message: {
      required: '必須項目です',
      'max:255': '255文字以下で入力してください',
      available: 'この名前は使用できません',
    },
    validate_success_message: {
      available: '入力できます',
    },
    sync_option: {
      available: {
        trigger: 'debounce',
        debounce_ms: 500,
      },
    },
    validate_hidden: {
      'max:255': true,
      available: true,
    },
  },
};
```

使用できる組み込みルールは`required`、`string`、`min:n`、`max:n`、`size:n`、`email`、`postcode`、`digits:n`、`numeric`、`same:field`です。独自ルールは`validate`配列内に名前と関数のオブジェクトで指定できます。

## 公開API

- コンポーネント: `UiBtn`、`UiTabs`、`UiForm`、`UiFormField`、`UiFormValidationMessages`、`UiFormPasswordField`、`UiFormPostcodeField`
- composable: `useApiForm`、`useForm`、`createForm`、`useFormConfigs`、`useValidation`
