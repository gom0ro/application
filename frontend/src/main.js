import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // <--- 1. Импорт роутера

const app = createApp(App)

app.use(router) // <--- 2. Подключение роутера к приложению

app.mount('#app')