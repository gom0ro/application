<template>
  <div class="auth-box">
    <h2>Вход в систему</h2>
    <form @submit.prevent="handleLogin">
      
      <div class="form-group">
        <label>Логин:</label>
        <input 
          v-model="username" 
          type="text" 
          placeholder="Введите ваш логин" 
          required 
        />
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="Введите ваш пароль" 
          required 
        />
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Вход...' : 'Войти' }}
      </button>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="link-text">
        Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api'; 

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    // 1. Используем URLSearchParams вместо FormData
    // Это гарантирует правильный формат для FastAPI (OAuth2)
    const params = new URLSearchParams();
    params.append('username', username.value.trim()); // .trim() убирает случайные пробелы
    params.append('password', password.value.trim());

    // 2. Отправляем запрос
    const response = await api.post('/token', params);

    // 3. Проверка: Что ответил сервер?
    console.log("Успешный вход:", response.data);

    // 4. Сохраняем токен
    localStorage.setItem('educoin_token', response.data.access_token);

    // 5. Перенаправляем
    const role = response.data.role ? response.data.role.toLowerCase() : 'unknown';
    
    if (role === 'teacher') router.push('/teacher');
    else if (role === 'parent') router.push('/parent');
    else if (role === 'child') router.push('/child');
    else router.push('/dashboard');

  } catch (err) {
    console.error("ОШИБКА ВХОДА:", err);
    
    // Показываем ошибку пользователю
    if (err.response && err.response.status === 401) {
      error.value = 'Неверный логин или пароль';
    } else if (err.response && err.response.status === 422) {
      error.value = 'Ошибка формата данных (422)';
    } else {
      error.value = 'Ошибка соединения с сервером';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Стили такие же, как в Register.vue */
.auth-box { max-width: 400px; margin: 40px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 15px; text-align: left; }
label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }
input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
input:focus { border-color: #2196F3; outline: none; box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2); }
button { width: 100%; padding: 12px; background-color: #2196F3; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.3s; }
button:hover { background-color: #1976D2; }
.error-msg { color: #d32f2f; margin-top: 10px; background: #ffebee; padding: 8px; border-radius: 4px; text-align: center; }
.link-text { margin-top: 15px; text-align: center; font-size: 14px; }
.link-text a { color: #2196F3; text-decoration: none; font-weight: bold; }
</style>