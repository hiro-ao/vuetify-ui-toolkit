<script setup lang="ts">
import type { VBtn } from 'vuetify/components';

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'accept' | 'cancel';
  }>(),
  {
    variant: 'default',
  },
);

let setColor;
let setVariant: VBtn['$props']['variant'];

switch (props.variant) {
  case 'default': {
    setColor = '';
    setVariant = 'elevated';
    break;
  }
  case 'accept': {
    setColor = 'primary';
    setVariant = 'elevated';
    break;
  }
  case 'cancel': {
    setColor = '';
    setVariant = 'tonal';
    break;
  }
  default: {
    setColor = '';
    setVariant = 'elevated';
  }

}

</script>

<template>
  <v-btn
    :color="setColor"
    :variant="setVariant"
    class="linear-loading"
  >
    <slot />
  </v-btn>
</template>

<style scoped>
/* 読み込み中はテーマ色を淡く敷き、通常状態と区別する */
.linear-loading.v-btn--loading {
  background-color: color-mix(
    in srgb,
    rgb(var(--v-theme-primary)) 16%,
    rgb(var(--v-theme-surface))
  ) !important;
  color: rgb(var(--v-theme-primary)) !important;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* 1. ローディング中もテキストやアイコンを消さずに100%表示 */
.linear-loading.v-btn--loading :deep(.v-btn__content) {
  opacity: 1 !important;
  /* visibility: visible !important; */
}

/* 2. 元のぐるぐる（円形インジケータ）を完全に消去 */
.linear-loading.v-btn--loading :deep(.v-btn__loader .v-progress-circular) {
  display: none !important;
}

/* 3. ローダーエリア自体を、本物の v-progress-linear と同じ土台（溝）に作り変える */
.linear-loading.v-btn--loading :deep(.v-btn__loader) {
  /* 修正：完全に絶対配置にしてボタンのサイズ計算から除外する */
  position: absolute !important;
  top: auto !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: 4px !important; /* バーの太さ */
  background-color: rgba(var(--v-theme-primary), 0.2) !important; /* 20%の薄い背景の溝 */

  /* 修正・追加：Vuetifyがローダー表示時にかけるレイアウト制限を無効化 */
  display: block !important;
  transform: none !important;
  overflow: hidden !important;
  max-width: none !important;  /* 追加：Vuetifyのmax-width指定を解除 */
  max-height: none !important; /* 追加：Vuetifyのmax-height指定を解除 */
}

/* 4. 本物のインプット風ローディングを再現する2つの動くバー */
.linear-loading.v-btn--loading :deep(.v-btn__loader)::before,
.linear-loading.v-btn--loading :deep(.v-btn__loader)::after {
  content: '' !important;
  position: absolute !important;
  top: 0 !important;
  bottom: 0 !important;
  background-color: rgb(var(--v-theme-primary)) !important; /* Vuetifyのテーマカラー */
}

/* ファーストバー（メインで伸び縮みしながら流れる） */
.linear-loading.v-btn--loading :deep(.v-btn__loader)::before {
  left: 0 !important;
  width: 100% !important;
  transform-origin: left !important;
  animation: v-linear-anim-first 2s linear infinite !important;
}

/* セカンドバー（後から追いかけるように流れる） */
.linear-loading.v-btn--loading :deep(.v-btn__loader)::after {
  left: 0 !important;
  width: 100% !important;
  transform-origin: left !important;
  animation: v-linear-anim-second 2s linear infinite !important;
}

/* 5. Vuetify純正の v-progress-linear アニメーション（X軸の移動と拡大縮小） */
@keyframes v-linear-anim-first {
  0% { transform: translateX(-100%) scaleX(0.1); }
  30% { transform: translateX(-40%) scaleX(0.7); }
  60% { transform: translateX(100%) scaleX(0.2); }
  100% { transform: translateX(100%) scaleX(0.2); }
}

@keyframes v-linear-anim-second {
  0% { transform: translateX(-100%) scaleX(0.1); }
  45% { transform: translateX(-100%) scaleX(0.1); }
  75% { transform: translateX(0%) scaleX(0.6); }
  100% { transform: translateX(100%) scaleX(0.1); }
}
</style>
