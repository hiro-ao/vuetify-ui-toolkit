<script setup lang="ts">

interface Props {
  floating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  floating: false,
});

defineOptions({
  inheritAttrs: false,
});

</script>

<template>
  <div class="liquid-tabs" :class="props.floating ? 'floating' : ''">
    <v-tabs v-bind="$attrs">
      <slot />
    </v-tabs>
  </div>
</template>

<style scoped>
/* 画面の下部中央に配置し、浮かせるための設定 */
.liquid-tabs.floating {
  position: absolute;
  /* top: 0px; */
  /* left: 50%; */
  /* transform: translateX(-50%); 中央寄せ */
  z-index: 999; /* 他の要素より手前に出す */
}

/* タブ全体のコンテナをiOS風（グレーの半透明カプセル）にする */
.liquid-tabs :deep(.v-tabs) {
  background-color: rgba(241, 241, 242, 0.85) !important; /* 背後が少し透けるように半透明に */
  backdrop-filter: blur(5px); /* iOS風のすりガラス効果 */
  border-radius: 30px !important; /* フローティング用に丸みを強く */
  padding: 4px !important;
  height: auto !important;
  display: inline-flex !important;
  /* タブ全体を大きく浮かせるための強力なシャドウ */
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.12), 0px 4px 10px rgba(0, 0, 0, 0.06) !important;
}


/* 各タブの基本デザイン */
.liquid-tabs :deep(.v-tab) {
  min-width: 90px;
  height: 40px !important; /* 少し高さを出して押しやすく */
  border-radius: 26px; /* 選択パーツも丸脚に */
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  z-index: 1;
  transition: color 0.2s ease;
  color: #636366 !important;
  --v-theme-on-surface: 99, 99, 102;
}


/* 追従する白い座布団（リキッドグラス） */
.liquid-tabs :deep(.v-tab__slider) {
  height: 100% !important;
  background-color: #ffffff !important;
  border-radius: 26px !important;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.15) !important;
  z-index: -1 !important; /* タブの下に配置する */
}
</style>
