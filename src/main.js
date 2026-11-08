import { createApp } from 'vue';
import App from './App.vue';
import { applyTheme } from './utils/theme.js';
import AppIcon from './components/AppIcon.vue';
import './styles.css';

applyTheme();
createApp(App).component('AppIcon', AppIcon).mount('#app');
