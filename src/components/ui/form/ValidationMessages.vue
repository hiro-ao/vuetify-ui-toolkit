<script setup lang="ts">
import { computed } from 'vue';
import { VIcon } from 'vuetify/components';
import type { ValidationMessage, ValidationMessages } from '../../../composables/useValidation';


interface Props {
  messages: ValidationMessages;
  isFocused: boolean;
  isBlured: boolean;
}

const props = defineProps<Props>();

const messages = computed(() => {
  if (props.isFocused) {
    return Object.fromEntries(
      Object.entries(props.messages || {}).filter(
        ([_, message]) => message.state !== 'hidden',
      ),
    );
  }
  // フォーカスが外れた場合もチェック中は表示する
  return Object.fromEntries(
    Object.entries(props.messages || {}).filter(
      ([_, message]) =>
        message.state === 'error' ||
        message.state === 'checking' ||
        (message.state === 'success' && message.showOnSuccess === true),
    ),
  );
});

const hasAlwaysVisibleSuccess = computed(() =>
  Object.values(messages.value).some(
    (message) => message.state === 'success' && message.showOnSuccess === true,
  ),
);

const isError = computed(() => {
  return Object.values(messages.value).some((message) => message.state === 'error');
});

// ルールの状態に基づいてアイコンを取得
const getRuleIcon = (message: ValidationMessage): string => {
  switch (message.state) {
    case 'success': {
      // 成功時のチェックアイコン
      return 'mdi-check-circle';
    }
    case 'checking': {
      return 'mdi-loading';
    }
    case 'error': {
      // エラー時の警告アイコン
      if (props.isBlured) {
        return 'mdi-alert-circle';
      }
      return 'mdi-circle-outline';
    }
    default: {
      // デフォルトの円アイコン
      return 'mdi-circle-outline';
    }
  }
};

// ルールの状態に基づいてアイコンの色を取得
const getRuleIconColor = (message: ValidationMessage): string => {
  switch (message.state) {
    case 'success': {
      // 成功時の緑色
      return 'success';
    }
    case 'checking': {
      return 'primary';
    }
    case 'error': {
      // エラー時の赤色
      if (props.isBlured) {
        return 'error';
      }
      return 'grey';
    }
    default: {
      // デフォルトのグレー
      return 'grey';
    }
  }
};

// ルールの状態に基づいてテキストのクラスを取得
const getRuleTextClass = (message: ValidationMessage): string => {
  switch (message.state) {
    case 'success': {
      // 成功時のテキストスタイル
      return 'text-success';
    }
    case 'checking': {
      return 'text-primary';
    }
    case 'error': {
      // エラー時のテキストスタイル
      if (props.isBlured) {
        return 'text-error';
      }
      return 'text-grey';
    }
    default: {
      // デフォルトのテキストスタイル
      return 'text-grey';
    }
  }
};
</script>

<template>
  <div
    v-if="Object.keys(messages).length > 0"
    :class="{
      'messages': true,
      'show': isFocused || isBlured || hasAlwaysVisibleSuccess,
      'error': isError && isBlured
    }"
    label
    variant="outlined"
  >
    <div class="messages-inner">
      <!-- 各バリデーションルールの表示 -->
      <TransitionGroup
        name="list"
        tag="div"
        class="message-list">

        <div
          v-for="(message, key) in messages"
          :key="key"
          class="message">
          <!-- ルールの状態を示すアイコン -->
          <v-icon
            :icon="getRuleIcon(message)"
            :color="getRuleIconColor(message)"
            :class="{ checking: message.state === 'checking' }"
            size="20"
          />
          <!-- ルールのメッセージ -->
          <span :class="getRuleTextClass(message)">{{ message.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.messages {
  position: relative;
  display: grid;
  grid-template-rows: 0fr; /* 初期状態は閉じる */
  opacity: 0;

  /* 非表示時の装飾を0に */
  margin-top: 0;
  padding: 0 12px;
  border-radius: 6px;
  overflow: visible; /* 三角が見えるようにvisible */

  --theme-color: rgb(var(--v-theme-primary));
  --theme-bg-color: rgba(var(--v-theme-primary), 0.1);

  /* すべてのプロパティをアニメーション対象にする */
  transition: all 0.3s ease-in-out;
}

.messages.error {
  --theme-color: rgb(var(--v-theme-error));
  --theme-bg-color: rgba(var(--v-theme-error), 0.1);
}

.messages.show {
  grid-template-rows: 1fr; /* 展開 */
  opacity: 1;
  margin-top: 5px;
  padding: 6px 12px;
  border-width: 1px;
  border: 1px solid var(--theme-color);
  background-color: var(--theme-bg-color);
}

/* 内部のラッパーで overflow: hidden をかける */
.messages-inner {
  min-height: 0;
  overflow: hidden;
}

/* 三角形のアニメーション連動 */
.messages::before,
.messages::after {
  content: "";
  position: absolute;
  left: 16px;
  transition: opacity 0.3s; /* 本体に合わせてフェード */
  opacity: 0;
}

.messages.show::before,
.messages.show::after {
  opacity: 1;
}

/* 三角の位置（overflow:visibleなので外側に出ても消えない） */
.messages::before {
  top: -12px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid var(--theme-color);
}
.messages::after {
  top: -10px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid color-mix(in srgb, var(--theme-color) 10%, rgb(var(--v-theme-surface)));
}

.message i.v-icon {
  height: 24px !important;
}

.message .checking {
  animation: validation-checking 1s linear infinite;
}

@keyframes validation-checking {
  to {
    transform: rotate(360deg);
  }
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 2px 0;
}

/* メッセージリストのコンテナ */
.message-list {
  position: relative;
}

/* 1. 動いている最中の transition 設定 */
.list-enter-active {
  /* 現れるときはすべて 0.3s でスムーズに */
  transition: all 0.3s ease-in-out;
}

.list-leave-active {
  /* 消えるとき：opacity（透明度）だけ一瞬（0s）で反映させ、他は 0.3s かける */
  transition: opacity 0s, height 0.3s ease-in-out, padding 0.3s ease-in-out, transform 0.3s ease-in-out;

  /* 削除される要素を浮かせて他の要素の移動を滑らかにする */
  position: absolute;
  left: 0;
  right: 0;
}

/* 2. 追加されるとき（開始）と、削除されるとき（終了）の状態 */
.list-enter-from,
.list-leave-to {
  opacity: 0;
  height: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  transform: translateY(-5px);
}

/* 3. 残った要素がスムーズに詰めるための設定 */
.list-move {
  transition: transform 0.3s ease-in-out;
}
</style>
