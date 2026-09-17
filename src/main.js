import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.scss'
import App from './app/App.vue'
import router from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
