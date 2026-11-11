<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  UiBtn,
  UiForm,
  UiTabs,
  useApiForm,
} from '../src';
import type { FormFieldSchema } from '../src';

const activeTab = ref('components');
const previewTab = ref('overview');
const isLoading = ref(false);
const submittedData = ref<Record<string, unknown> | null>(null);
const composableResult = ref<Record<string, unknown> | null>(null);

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const schema = computed<Record<string, FormFieldSchema>>(() => ({
  name: {
    label: 'お名前',
    type: 'text',
    autocomplete: 'name',
    placeholder: '山田太郎',
    helper_message: 'お名前は2文字以上で入力してください',
    default_value: '',
    validate: [
      'required',
      'string',
      'max:255',
      {
        validate_name: async (value: string) => {
          await sleep(1200);
          return value.trim().length >= 2;
        },
      },
    ],
    validate_message: {
      required: 'お名前を入力してください',
      string: '文字列を指定してください',
      'max:255': '255文字以下で入力してください',
      validate_name: 'validate_name sync',
    },
    validate_success_message: {
      validate_name: 'validate_name sync OK',
    },
    sync_option: {
      validate_name: {
        trigger: 'debounce',
        debounce_ms: 500,
      },
    },
    validate_hidden: {
      'max:255': true,
      validate_name: true,
    },
  },
  email: {
    label: 'メールアドレス',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'hanako@example.com',
    default_value: '',
    validate: ['required', 'email'],
    validate_message: {
      required: 'メールアドレスを入力してください',
      email: '有効なメールアドレスを入力してください',
    },
    validate_hidden: {
      required: true,
      email: true,
    },
  },
  postcode: {
    label: '郵便番号',
    type: 'postcode',
    autocomplete: 'postal-code',
    placeholder: '457-0000',
    helper_message: 'ハイフンあり・なしのどちらでも入力できます',
    default_value: '',
    validate: ['required', 'postcode'],
    validate_message: {
      required: '必須項目です',
      postcode: '郵便番号は7桁で入力してください',
    },
  },
}));

const {
  handleSubmit: submitApiForm,
  isSubmitting,
  serverErrors,
} = useApiForm({
  request: async (data: Record<string, unknown>) =>
    new Promise<Record<string, unknown>>((resolve) => {
      window.setTimeout(() => resolve(data), 1800);
    }),
  onSuccess: (response) => {
    composableResult.value = response;
  },
});

const showLoading = () => {
  isLoading.value = true;
  window.setTimeout(() => {
    isLoading.value = false;
  }, 1800);
};

const handleSubmit = (data: Record<string, unknown>) => {
  submittedData.value = data;
};
</script>

<template>
  <v-app>
    <v-main>
      <div class="playground">
        <header class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              <span class="eyebrow-dot" />
              COMPONENT PLAYGROUND
            </div>
            <h1>Vuetify UI <span>Toolkit</span></h1>
            <p>コンポーネントの見た目と動作を、このページで試せます。</p>
          </div>
          <div class="hero-mark" aria-hidden="true">
            <div class="mark-orbit orbit-one" />
            <div class="mark-orbit orbit-two" />
            <div class="mark-core">V</div>
          </div>
        </header>

        <ui-tabs v-model="activeTab" class="demo-tabs" color="primary">
          <v-tab value="components">コンポーネント</v-tab>
          <v-tab value="composables">Composables</v-tab>
        </ui-tabs>

        <v-window v-model="activeTab" class="demo-window">
          <v-window-item value="components">
            <section class="section-heading">
              <div>
                <div class="section-kicker">01 / COMPONENTS</div>
                <h2>UIパーツ</h2>
                <p>実際のアプリと同じテーマで表示しています。</p>
              </div>
              <span class="section-count">3 COMPONENTS</span>
            </section>

            <div class="component-grid">
              <v-card class="showcase-card button-card" rounded="xl" elevation="0">
                <div class="card-heading">
                  <div>
                    <span class="component-tag">UiBtn</span>
                    <h3>ボタン</h3>
                  </div>
                  <span class="card-index">01</span>
                </div>
                <p class="card-description">用途に合わせた3つのvariantと、ローディング表示。</p>
                <div class="button-row">
                  <ui-btn>Default</ui-btn>
                  <ui-btn variant="accept">Accept</ui-btn>
                  <ui-btn variant="cancel">Cancel</ui-btn>
                </div>
                <div class="loading-row">
                  <ui-btn variant="accept" :loading="isLoading" @click="showLoading">
                    {{ isLoading ? '処理中...' : 'ローディングを試す' }}
                  </ui-btn>
                  <span class="hint">クリックで1.8秒間表示</span>
                </div>
              </v-card>

              <v-card class="showcase-card tabs-card" rounded="xl" elevation="0">
                <div class="card-heading">
                  <div>
                    <span class="component-tag">UiTabs</span>
                    <h3>リキッドタブ</h3>
                  </div>
                  <span class="card-index">02</span>
                </div>
                <p class="card-description">選択中のタブが分かる、ガラス調のタブバー。</p>
                <div class="tabs-demo">
                  <ui-tabs v-model="previewTab" class="demo-tabs-inline">
                    <v-tab value="overview">Overview</v-tab>
                    <v-tab value="settings">Settings</v-tab>
                  </ui-tabs>
                </div>
                <div class="tabs-state">
                  <span class="state-indicator" />
                  選択中: <strong>{{ previewTab }}</strong>
                </div>
              </v-card>

              <v-card class="showcase-card form-card" rounded="xl" elevation="0">
                <div class="card-heading">
                  <div>
                    <span class="component-tag">UiForm</span>
                    <h3>フォーム</h3>
                  </div>
                  <span class="card-index">03</span>
                </div>
                <p class="card-description">スキーマから入力欄を生成。入力して送信を試せます。</p>
                <ui-form
                  submit-endpoint="/playground"
                  :schema="schema"
                  :server-errors="serverErrors"
                  @submit="handleSubmit"
                />
                <div v-if="submittedData" class="form-result">
                  <span class="state-indicator" />
                  送信イベントを受け取りました
                  <code>{{ JSON.stringify(submittedData) }}</code>
                </div>
              </v-card>
            </div>
          </v-window-item>

          <v-window-item value="composables">
            <section class="section-heading">
              <div>
                <div class="section-kicker">02 / COMPOSABLES</div>
                <h2>ロジックを再利用</h2>
                <p>通信クライアントに依存しないフォーム処理。</p>
              </div>
              <span class="section-count">API READY</span>
            </section>

            <v-card class="showcase-card composable-card" rounded="xl" elevation="0">
              <div class="card-heading">
                <div>
                  <span class="component-tag">useApiForm</span>
                  <h3>APIフォーム状態</h3>
                </div>
                <span class="card-index">01</span>
              </div>
              <p class="card-description">
                SanctumやElysia Edenなどのリクエスト関数を渡して利用できます。
              </p>
              <div class="composable-state">
                <div class="state-item">
                  <span>送信状態</span>
                  <strong :class="{ 'text-primary': isSubmitting }">
                    {{ isSubmitting ? 'Sending' : 'Ready' }}
                  </strong>
                </div>
                <div class="state-item">
                  <span>サーバーエラー</span>
                  <strong>{{ Object.keys(serverErrors).length }} 件</strong>
                </div>
              </div>
              <ui-btn
                variant="accept"
                :loading="isSubmitting"
                @click="submitApiForm({ source: 'playground' })"
              >
                {{ isSubmitting ? '送信中...' : '送信を試す' }}
              </ui-btn>
              <div v-if="composableResult" class="form-result">
                <span class="state-indicator" />
                送信完了
                <code>{{ JSON.stringify(composableResult) }}</code>
              </div>
              <pre class="code-sample"><code>useApiForm({
  request: (data, options) =&gt; api.users.post(data),
  getValidationErrors: toFieldErrors,
})</code></pre>
            </v-card>
          </v-window-item>
        </v-window>

        <footer class="page-footer">
          <span>VUETIFY UI TOOLKIT</span>
          <span>Built for Vue 3 + Vuetify</span>
        </footer>
      </div>
    </v-main>
  </v-app>
</template>
