// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Импортируем компоненты страниц
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
// Новые кабинеты
import TeacherDashboard from '../views/TeacherDashboard.vue'
import ChildDashboard from '../views/ChildDashboard.vue'
import ParentDashboard from '../views/ParentDashboard.vue'
import Profile from '../views/Profile.vue'

// Простая функция защиты (проверяет, есть ли запись в браузере)
// Простая функция защиты
const requireAuth = (to, from, next) => {
  // БЫЛО: if (localStorage.getItem('educoin_user')) {  <-- ОШИБКА
  
  // СТАЛО: Проверяем токен, который мы сохранили при входе
  if (localStorage.getItem('educoin_token')) { 
    next();
  } else {
    next('/login');
  }
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      redirect: '/login' 
    },
    { 
      path: '/login', 
      name: 'login',
      component: Login 
    },
    { 
      path: '/register', 
      name: 'register',
      component: Register 
    },
    // --- НОВЫЕ ПУТИ ---
    { 
      path: '/teacher', 
      name: 'teacher',
      component: TeacherDashboard,
      beforeEnter: requireAuth // Защита
    },
    { 
      path: '/child', 
      name: 'child',
      component: ChildDashboard,
      beforeEnter: requireAuth // Защита
    },
    { 
      path: '/parent', 
      name: 'parent',
      component: ParentDashboard,
      beforeEnter: requireAuth // Защита
    },
    { 
  path: '/profile', 
  name: 'profile',
  component: Profile,
  beforeEnter: requireAuth 
},
    // Общий дашборд (можно оставить как запасной)
    { 
      path: '/dashboard', 
      name: 'dashboard',
      component: Dashboard,
      beforeEnter: requireAuth
    }
  ]
})

export default router