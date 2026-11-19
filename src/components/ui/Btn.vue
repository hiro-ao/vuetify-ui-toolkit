<script setup lang="ts">
import { defineComponent, getCurrentInstance } from 'vue';
import { useDefaults, useTheme } from 'vuetify';
import { VBtn } from 'vuetify/components';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  ...VBtn.props,
  variant: {
    type: String,
    default: undefined,
  },
});
const defaultedProps = useDefaults(props, 'UiBtn');
const instance = getCurrentInstance();
const theme = useTheme();
const UiBtnVariantDefaults = defineComponent({
  setup(_, { slots }) {
    const defaults = useDefaults(undefined, 'UiBtn');
    return () => slots.default?.({ variants: defaults.variant });
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExplicitProp(key: string) {
  const vnodeProps = instance?.vnode.props;
  const kebabKey = key.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);

  return vnodeProps !== null
    && vnodeProps !== undefined
    && (
      Object.prototype.hasOwnProperty.call(vnodeProps, key)
      || Object.prototype.hasOwnProperty.call(vnodeProps, kebabKey)
    );
}

function getVBtnProps(variantConfig: unknown): Record<string, unknown> {
  const { variant: defaultVariant, ...defaults } = defaultedProps;
  const variantPresets = isRecord(variantConfig) ? variantConfig : undefined;
  const selectedVariant = props.variant ?? (variantPresets ? 'default' : undefined);
  const presetValue = selectedVariant ? variantPresets?.[selectedVariant] : undefined;
  const preset = isRecord(presetValue) ? presetValue : undefined;
  const explicitProps: Record<string, unknown> = {};

  for (const key of Object.keys(props)) {
    if (key !== 'variant' && hasExplicitProp(key)) {
      explicitProps[key] = props[key as keyof typeof props];
    }
  }

  const buttonProps: Record<string, unknown> = {
    ...defaults,
    ...preset,
    ...explicitProps,
  };
  const variant = preset
    ? preset.variant
    : variantPresets
      ? props.variant
      : defaultVariant;

  if (variant !== undefined) {
    buttonProps.variant = variant;
  }

  return buttonProps;
}

function getLinearLoadingColor(variantConfig: unknown) {
  const color = getVBtnProps(variantConfig).color;

  if (typeof color !== 'string' || !color) {
    return 'rgb(var(--v-theme-primary))';
  }

  return Object.prototype.hasOwnProperty.call(theme.current.value.colors, color)
    ? `rgb(var(--v-theme-${color}))`
    : color;
}
</script>

<template>
  <UiBtnVariantDefaults v-slot="{ variants }">
    <VBtn
      v-bind="{ ...getVBtnProps(variants), ...$attrs }"
      :style="{ '--linear-loading-color': getLinearLoadingColor(variants) }">
      <slot />
    </VBtn>
  </UiBtnVariantDefaults>
</template>

<style scoped>
/* 読み込み中はテーマ色を淡く敷き、通常状態と区別する */
.linear-loading.v-btn--loading {
  background-color: color-mix(
    in srgb,
    var(--linear-loading-color) 16%,
    rgb(var(--v-theme-surface))
  ) !important;
  color: var(--linear-loading-color) !important;
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
  background-color: color-mix(in srgb, var(--linear-loading-color) 20%, transparent) !important;

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
  background-color: var(--linear-loading-color) !important;
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
