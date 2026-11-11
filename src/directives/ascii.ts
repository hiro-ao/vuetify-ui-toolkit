// src/directives/ascii.ts
import type { Directive } from 'vue';
import { nextTick } from 'vue';

const directiveListeners = new WeakMap<
  HTMLElement,
  { input: HTMLInputElement; beforeInput: (event: InputEvent) => void }
>();

const getCursorPosition = (value: string, expectedPrefix: string) => {
  let valueIndex = 0;
  let prefixIndex = 0;

  while (prefixIndex < expectedPrefix.length && valueIndex < value.length) {
    if (value[valueIndex] === expectedPrefix[prefixIndex]) {
      prefixIndex++;
      valueIndex++;
    } else if (!/[\p{L}\p{N}]/u.test(value[valueIndex])) {
      valueIndex++;
    } else {
      break;
    }
  }

  return valueIndex;
};

export const asciiDirective: Directive<HTMLElement> = {
  mounted(el) {
    const input = el instanceof HTMLInputElement
      ? el
      : el.querySelector<HTMLInputElement>('input');
    if (!input) return;

    const beforeInput = (event: InputEvent) => {
      if (!event.data) return;

      const normalized = event.data.normalize('NFKC');
      if (event.data === normalized) return;

      event.preventDefault();

      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const previousValue = input.value;
      const nextValue =
        previousValue.slice(0, start) +
        normalized +
        previousValue.slice(end);
      const expectedCursor = start + normalized.length;
      input.setRangeText(normalized, start, end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));

      void nextTick(() => {
        const cursor = getCursorPosition(
          input.value,
          nextValue.slice(0, expectedCursor),
        );
        input.setSelectionRange(cursor, cursor);
      });
    };

    input.addEventListener('beforeinput', beforeInput);
    directiveListeners.set(el, { input, beforeInput });
  },

  unmounted(el) {
    const registration = directiveListeners.get(el);
    if (!registration) return;
    registration.input.removeEventListener('beforeinput', registration.beforeInput);
    directiveListeners.delete(el);
  },
};

export default asciiDirective;
