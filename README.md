# Vuetify UI Toolkit

再利用可能なVueコンポーネントとcomposableをまとめたライブラリーです。Vue 3とVuetify 3は利用側アプリで用意してください。

## インストール

```sh
npm config set @hiro-ao:registry https://npm.pkg.github.com
npm login --scope=@hiro-ao --auth-type=legacy --registry=https://npm.pkg.github.com
npm install @hiro-ao/vuetify-ui-toolkit
```

GitHub Packagesからインストールするには、`read:packages`権限のあるGitHub Personal Access Token (classic) で認証してください。トークンはnpmのユーザー設定に保存し、リポジトリにはコミットしないでください。利用者には対象パッケージへのアクセス権も必要です。

## Nuxtでの利用

Nuxtアプリでも通常のnpmパッケージとしてインストールします。Vuetify 3のNuxtモジュールなど、Vuetifyのセットアップは別途必要です。Vuetifyをすでに導入済みなら、Vuetifyやアイコンフォントを重ねてインストールする必要はありません。

```sh
npm install @hiro-ao/vuetify-ui-toolkit
```

Vuetify用NuxtモジュールがVuetifyのスタイルを自動で読み込む構成なら、`vuetify/styles`を追加する必要はありません。ライブラリーのスタイルは読み込んでください。

```ts
export default defineNuxtConfig({
  css: ['@hiro-ao/vuetify-ui-toolkit/style.css'],
});
```

Vuetify用Nuxtモジュールでスタイルの自動読み込みを無効にしている場合に限り、`vuetify/styles`を`css`に追加してください。

`plugins/vuetify-ui-toolkit.ts`を作成し、Vueアプリにプラグインを登録します。Nuxtが`plugins/`内のプラグインを自動読み込みするため、`nuxt.config.ts`への登録は不要です。

```ts
import { VuetifyUiToolkit } from '@hiro-ao/vuetify-ui-toolkit';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VuetifyUiToolkit);
});
```

これで`UiBtn`、`UiTabs`、フォームコンポーネントと`v-ascii`がグローバル登録されます。コンポーネントはテンプレートから利用できます。

```vue
<script setup lang="ts">
import { ref } from 'vue';

const postcode = ref('');
</script>

<template>
  <UiBtn>保存</UiBtn>
  <UiFormPostcodeField v-model="postcode" />
</template>
```

Vuetifyの標準アイコンセットはMDIですが、Vuetify本体にアイコンフォントファイルが含まれているわけではありません。Vuetify用NuxtモジュールがMDIフォントとCSSを設定しているなら追加設定は不要です。設定していない場合は`@mdi/font`をインストールしてCSSを読み込み、Vuetifyのアイコンセットを`mdi`に設定してください。別のアイコンセットを利用している場合は、MDIアイコンを使用するフォームのアイコン表示がそのままでは一致しないことがあります。

## 公開

先にリリース対象の変更をコミットしてください。`npm version`は作業ツリーがcleanでないと失敗します。変更をコミットした後、`npm version patch`でバージョン更新用コミットと`v*`タグを作成し、pushすると、GitHub Actionsが型チェック・ビルドを実行してGitHub Packagesへ公開します。

```sh
npm version patch
git push --follow-tags
```

minor/majorリリースでは`npm version minor`または`npm version major`を使います。ワークフローは`v*`タグのpushで起動し、`GITHUB_TOKEN`には`packages: write`権限を設定しています。

GitHub Packagesのパッケージ設定で、VisibilityがPrivateになっていることを確認してください。

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
import '@hiro-ao/vuetify-ui-toolkit/style.css';
import { VuetifyUiToolkit } from '@hiro-ao/vuetify-ui-toolkit';
import App from './App.vue';

createApp(App)
  .use(createVuetify({ icons: { defaultSet: 'mdi' } }))
  .use(VuetifyUiToolkit)
  .mount('#app');
```

フォームのバリデーションアイコンにはMaterial Design Iconsを使用します。Vuetify側ですでにMDIフォントを読み込んでいる場合、CSSを重複してimportする必要はありません。未設定の場合は利用側で`@mdi/font`のCSSを読み込み、Vuetifyのアイコンセットを`mdi`に設定してください。

`app.use(VuetifyUiToolkit)`を使うと、`v-ascii`ディレクティブもグローバル登録されます。全角ASCII入力を半角に変換します。プラグインを使わない場合は、個別に登録できます。

```ts
import { asciiDirective } from '@hiro-ao/vuetify-ui-toolkit';

app.directive('ascii', asciiDirective);
```

プラグインを使わず、必要なコンポーネントだけを登録することもできます。

```ts
import { UiBtn, UiTabs, useValidation } from '@hiro-ao/vuetify-ui-toolkit';
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
