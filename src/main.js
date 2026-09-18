import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.scss'
import App from './app/App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { configureApiAuth } from './services/api/client'

const app = createApp(App)
app.use(createPinia())
configureApiAuth(useAuthStore())
app.use(router).mount('#app')
