<template>
  <div class="profile-container fade-in">
    <div class="header">
      <button class="back-btn" @click="$router.go(-1)">← Назад</button>
      <h2>Настройки профиля</h2>
    </div>

    <div class="avatar-section">
      <div class="current-avatar">{{ form.avatar }}</div>
      <h3>Выберите аватар</h3>
      <div class="avatar-grid">
        <div 
          v-for="av in avatars" 
          :key="av" 
          class="avatar-option"
          :class="{ active: form.avatar === av }"
          @click="form.avatar = av"
        >
          {{ av }}
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="input-group">
        <label>Ваше Имя</label>
        <input v-model="form.full_name" placeholder="Иван Иванов" />
      </div>

      <div class="input-group">
        <label>Email (необязательно)</label>
        <input v-model="form.email" placeholder="example@mail.com" />
      </div>

      <button class="save-btn" @click="saveProfile" :disabled="isLoading">
        {{ isLoading ? 'Сохранение...' : 'Сохранить изменения' }}
      </button>
    </div>

    <button class="logout-btn" @click="logout">Выйти из аккаунта</button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const isLoading = ref(false);

// Набор аватаров (можете добавить свои эмодзи)
const avatars = ['😎', '👻', '🤖', '🐱', '🦄', '🦁', '🦊', '🐼', '🐸', '👾', '👑', '🎓'];

const form = reactive({
  full_name: '',
  email: '',
  avatar: '😎'
});

// Загрузка текущих данных
const loadProfile = async () => {
  try {
    const res = await api.get('/users/me');
    form.full_name = res.data.full_name;
    form.email = res.data.email;
    form.avatar = res.data.avatar || '😎';
  } catch (err) {
    console.error(err);
  }
};

// Сохранение
const saveProfile = async () => {
  isLoading.value = true;
  try {
    await api.put('/users/me', form);
    alert('Профиль обновлен!');
  } catch (err) {
    alert('Ошибка обновления');
  } finally {
    isLoading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('educoin_token');
  localStorage.removeItem('educoin_role');
  router.push('/login');
};

onMounted(loadProfile);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

.profile-container {
  font-family: 'Inter', sans-serif;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  color: #1e293b;
}

.header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
.back-btn { background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b; }
.back-btn:hover { color: #3b82f6; }
h2 { margin: 0; font-size: 22px; }

/* Аватары */
.avatar-section { text-align: center; margin-bottom: 30px; }
.current-avatar {
  font-size: 80px;
  margin-bottom: 10px;
  animation: bounce 0.5s;
}
.avatar-grid {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
.avatar-option {
  font-size: 32px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: transform 0.2s;
}
.avatar-option:hover { transform: scale(1.2); }
.avatar-option.active { border-color: #3b82f6; background: #eff6ff; }

/* Форма */
.form-section { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.input-group { margin-bottom: 15px; text-align: left; }
.input-group label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 13px; color: #64748b; }
input {
  width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; box-sizing: border-box;
}

.save-btn {
  width: 100%; padding: 14px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px;
}
.save-btn:hover { background: #2563eb; }

.logout-btn {
  margin-top: 30px; width: 100%; padding: 14px; background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
}
.logout-btn:hover { background: #fecaca; }

@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>