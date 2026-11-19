import { defineComponent, h, type Component } from 'vue';

export function withDefaultsName(component: Component, defaultsName: string): Component {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(component, { ...attrs, defaultsName }, slots);
    },
  });
}
