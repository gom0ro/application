<template>
  <div class="auth-box">
    <h2>Регистрация</h2>
    <form @submit.prevent="handleRegister">
      
      <div class="form-group">
        <label>Логин:</label>
        <input v-model="form.username" required placeholder="Придумайте логин" />
      </div>

      <div class="form-group">
        <label>Полное имя:</label>
        <input v-model="form.full_name" required placeholder="Иван Иванов" />
      </div>

      <div class="form-group">
        <label>Пароль:</label>
        <input v-model="form.password" type="password" required placeholder="Придумайте пароль" />
      </div>

      <div class="form-group">
        <label>Кто вы?</label>
        <select v-model="form.role" required>
          <option value="child">👶 Я Ребенок (Ученик)</option>
          <option value="parent">👨‍👩‍👧 Я Родитель</option>
          <option value="teacher">👨‍🏫 Я Учитель</option>
        </select>
      </div>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="link-text">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const isLoading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  full_name: '',
  password: '',
  role: 'child' // По умолчанию
});

const handleRegister = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    // Отправляем данные на сервер
    await api.post('/register', form);
    alert('Регистрация успешна! Теперь войдите.');
    router.push('/login');
  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.detail || 'Ошибка регистрации';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-box { max-width: 400px; margin: 40px auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: 'Inter', sans-serif; }
h2 { text-align: center; color: #333; }
.form-group { margin-bottom: 15px; text-align: left; }
label { display: block; margin-bottom: 5px; font-weight: 600; color: #333; }
input, select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
input:focus, select:focus { border-color: #2196F3; outline: none; }
button { width: 100%; padding: 12px; background-color: #4CAF50; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 10px; }
button:hover { background-color: #45a049; }
.error-msg { color: #d32f2f; margin-top: 10px; background: #ffebee; padding: 8px; border-radius: 4px; text-align: center; }
.link-text { margin-top: 15px; text-align: center; font-size: 14px; }
.link-text a { color: #2196F3; text-decoration: none; font-weight: bold; }
</style>