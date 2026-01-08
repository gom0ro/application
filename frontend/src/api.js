import axios from 'axios';
import router from './router'; // Подключаем роутер, чтобы кидать на логин, если токен протух

// 1. Создаем настройку подключения
const api = axios.create({
  baseURL: 'http://localhost:8000', // Адрес вашего сервера
});

// 2. ВОТ ГЛАВНЫЙ СЕКРЕТ (Interceptors)
// Перед КАЖДЫМ запросом эта функция проверяет localStorage
api.interceptors.request.use(
  (config) => {
    // Достаем токен из "памяти браузера"
    const token = localStorage.getItem('educoin_token');
    
    // Если токен есть — приклеиваем его к запросу
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Если сервер ответил "Ошибка 401" (Токен протух или неверный)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Удаляем плохой токен и кидаем на вход
      localStorage.removeItem('educoin_token');
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default api;