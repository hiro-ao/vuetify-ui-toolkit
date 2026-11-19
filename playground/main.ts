import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { VuetifyUiToolkit } from '../src';
import App from './App.vue';
import './style.css';

const vuetify = createVuetify({
  components,
  directives,
  defaults: {
    UiBtn: {
      variant: {
        default: {
          color: 'primary',
          variant: 'elevated',
        },
        accept: {
          color: 'primary',
          variant: 'elevated',
        },
        cancel: {
          color: '',
          variant: 'tonal',
        },
        secondary: {
          color: 'secondary',
          variant: 'tonal',
        },
        success: {
          color: 'success',
          variant: 'elevated',
        },
        error: {
          color: 'error',
          variant: 'elevated',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#6750a4',
          secondary: '#625b71',
          surface: '#ffffff',
          background: '#f5f6fa',
        },
      },
    },
  },
});

createApp(App).use(vuetify).use(VuetifyUiToolkit).mount('#app');
