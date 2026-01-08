<template>
  <div class="dashboard-container">
    
    <header class="dashboard-header fade-in">
      <div class="header-top">
        <div class="text-content">
          <h1>Привет, {{ user?.full_name || user?.username || 'Ученик' }}! 👋</h1>
          <p class="subtitle">Готов заработать немного монет сегодня?</p>
        </div>
        
        <div class="avatar-btn" @click="$router.push('/profile')" title="Настройки профиля">
          {{ user?.avatar || '😎' }}
        </div>
      </div>
    </header>

    <div class="widgets-grid">
      
      <div class="widget-card balance-card slide-up" :style="{ animationDelay: '0.1s' }">
        <div class="card-content">
          <div class="icon-wrapper coin-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          </div>
          <div class="text-info">
            <span class="label">Твой баланс</span>
            <span class="value">{{ user?.coins || 0 }} <span>монет</span></span>
          </div>
        </div>
        <div class="card-bg-decoration"></div>
      </div>

    

      <div 
        class="widget-card code-card slide-up" 
        :style="{ animationDelay: '0.2s' }"
        @click="copyCode"
        :class="{ 'copied': isCopied }"
      >
        <div class="card-content">
          <div class="icon-wrapper id-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="text-info">
            <span class="label">Код приглашения</span>
            <div class="code-display">
              <span class="code-text">{{ user?.invite_code || '...' }}</span>
              <span class="copy-hint" v-if="!isCopied">Нажми, чтобы скопировать</span>
              <span class="copy-hint success" v-else>Скопировано!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    

    <h3 class="section-title fade-in">Мои задания</h3>

    <div v-if="tasks.length > 0" class="tasks-list">
      <div 
        v-for="(task, index) in tasks" 
        :key="task.id" 
        class="task-card slide-up"
        :style="{ animationDelay: (0.3 + index * 0.1) + 's' }"
      >
        <div class="task-header">
          <span class="type-badge" :class="task.task_type">
            {{ getTypeLabel(task.task_type) }}
          </span>
          <span class="price-badge">{{ task.price }} 💰</span>
        </div>

        <h4 class="task-title">{{ task.title }}</h4>

        <div v-if="task.task_type === 'text'" class="task-body">
          <p>{{ task.description }}</p>
        </div>

        <div v-if="task.task_type === 'video'" class="task-body">
          <p>{{ task.description }}</p>
          
          <div v-if="isYoutube(task.content)" class="video-container">
            <iframe 
              :src="getYoutubeEmbed(task.content)" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
          <a v-else :href="task.content" target="_blank" class="external-link">
             🔗 Открыть ссылку на материал
          </a>
        </div>

        <div v-if="task.task_type === 'test'" class="task-body">
          <p class="question">❓ {{ task.description }}</p>
          
          <div v-if="task.status === 'new'" class="quiz-grid">
            <button 
              v-for="option in parseOptions(task.content)" 
              :key="option"
              class="quiz-btn"
              @click="checkAnswer(task, option)"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div class="task-footer">
          <button 
            v-if="task.status === 'new' && task.task_type !== 'test'" 
            class="submit-btn"
            @click="submitTask(task.id)"
          >
            ✅ Я выполнил задание
          </button>

          <div v-else-if="task.status === 'pending'" class="status-badge pending">
            ⏳ На проверке у родителя
          </div>
          <div v-else-if="task.status === 'completed'" class="status-badge completed">
            🎉 Выполнено (+{{ task.price }})
          </div>
        </div>

      </div>
    </div>

    <div v-else class="empty-state fade-in">
      <p>Заданий пока нет. Отдыхай! 🏖️</p>
    </div>
     <h3 class="section-title">🏦 Обменник (Вывод на Kaspi)</h3>

<div class="kaspi-card fade-in">
  <div class="kaspi-header">
    <span class="kaspi-logo">Kaspi Gold</span>
    <span class="balance-label">Твой баланс: {{ user?.coins }} ₸</span>
  </div>
  
  <div class="kaspi-body">
    <div class="input-row">
      <label>Номер телефона:</label>
      <input v-model="withdrawPhone" placeholder="+7 777 ..." />
    </div>
    
    <div class="input-row">
      <label>Сумма вывода:</label>
      <input v-model.number="withdrawAmount" type="number" placeholder="100" />
    </div>

    <button class="kaspi-btn" @click="doWithdraw">
      🔄 Обменять на тенге
    </button>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const user = ref(null);
const tasks = ref([]);
const isCopied = ref(false);

// --- ЗАГРУЗКА ДАННЫХ ---
const loadData = async () => {
  try {
    // 1. Грузим юзера
    const userRes = await api.get('/users/me');
    user.value = userRes.data;

    // 2. Грузим задачи
    const tasksRes = await api.get('/tasks/');
    tasks.value = tasksRes.data;
  } catch (err) {
    console.error(err);
  }
};

// --- ЛОГИКА КОПИРОВАНИЯ КОДА ---
const copyCode = () => {
  if (!user.value?.invite_code) return;
  navigator.clipboard.writeText(user.value.invite_code);
  isCopied.value = true;
  setTimeout(() => { isCopied.value = false; }, 2000);
};

// --- ЛОГИКА ЗАДАНИЙ ---

// 1. Обычная сдача (текст/видео)
const submitTask = async (id) => {
  if (!confirm('Точно все сделал?')) return;
  try {
    await api.post(`/tasks/${id}/submit`);
    loadData(); // Обновляем список
  } catch (err) {
    alert('Ошибка отправки');
  }
};

// 2. Проверка теста
const checkAnswer = async (task, selectedOption) => {
  if (selectedOption.trim() === task.correct_answer.trim()) {
    // Правильно!
    alert('Правильно! 🎉 Молодец!');
    await api.post(`/tasks/${task.id}/submit`);
    loadData();
  } else {
    // Ошибка
    alert('Неверно ❌ Подумай еще!');
  }
};

// --- ХЕЛПЕРЫ (Вспомогательные функции) ---

const getTypeLabel = (type) => {
  if (type === 'test') return 'Викторина';
  if (type === 'video') return 'Видео';
  return 'Чтение';
};

const parseOptions = (str) => {
  return str ? str.split(',').map(s => s.trim()) : [];
};

// Проверка на YouTube
const isYoutube = (url) => {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
};

// Генерация ссылки для плеера
const getYoutubeEmbed = (url) => {
  if (!url) return '';
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1];
  } else if (url.includes('v=')) {
    videoId = url.split('v=')[1].split('&')[0];
  } else if (url.includes('embed/')) {
    return url;
  }
  return `https://www.youtube.com/embed/${videoId}`;
};
const withdrawAmount = ref('');
const withdrawPhone = ref('');

const doWithdraw = async () => {
  if (!withdrawAmount.value || !withdrawPhone.value) return alert('Заполни все поля!');
  if (user.value.coins < withdrawAmount.value) return alert('Не хватает монет!');

  try {
    await api.post('/users/withdraw', {
      amount: withdrawAmount.value,
      phone_number: withdrawPhone.value
    });
    alert('Заявка отправлена! Скажи родителю проверить приложение.');
    withdrawAmount.value = '';
    loadData(); // Обновить баланс
  } catch (err) {
    alert('Ошибка: ' + err.response?.data?.detail);
  }
};

onMounted(loadData);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

.kaspi-card {
  background: #f14635; /* Красный цвет Kaspi */
  color: white;
  padding: 20px;
  border-radius: 16px;
  margin-top: 20px;
  box-shadow: 0 10px 20px rgba(241, 70, 53, 0.3);
}
.kaspi-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px; font-size: 18px; }
.input-row { margin-bottom: 10px; }
.input-row label { display: block; font-size: 12px; margin-bottom: 5px; opacity: 0.9; }
.input-row input { 
  width: 100%; padding: 10px; border-radius: 8px; border: none; font-size: 16px; 
  color: #333; outline: none; box-sizing: border-box;
}
.kaspi-btn {
  width: 100%; background: white; color: #f14635; font-weight: bold; 
  padding: 12px; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;
}
.kaspi-btn:hover { background: #fff5f5; }

.dashboard-container {
  font-family: 'Inter', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1e293b;
}

/* --- HEADER --- */
.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
.header-top h1 { margin: 0 0 5px 0; font-size: 26px; font-weight: 800; color: #0f172a; }
.subtitle { margin: 0; color: #64748b; }

.avatar-btn {
  font-size: 32px;
  cursor: pointer;
  background: #f1f5f9;
  width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  transition: transform 0.2s;
}
.avatar-btn:hover { transform: scale(1.1); background: #e2e8f0; }

/* --- WIDGETS --- */
.widgets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }

.widget-card {
  background: white; padding: 24px; border-radius: 20px; 
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9; position: relative; overflow: hidden;
  transition: transform 0.3s;
}
.widget-card:hover { transform: translateY(-5px); }

.card-content { display: flex; align-items: center; gap: 20px; position: relative; z-index: 2; }
.icon-wrapper { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.text-info { display: flex; flex-direction: column; }
.label { font-size: 13px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
.value { font-size: 32px; font-weight: 800; line-height: 1; }

/* Balance Specific */
.balance-card { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none; }
.balance-card .icon-wrapper { background: rgba(255, 255, 255, 0.2); }
.balance-card .label { color: rgba(255, 255, 255, 0.8); }
.card-bg-decoration { position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; z-index: 1; }

/* Code Specific */
.code-card { cursor: pointer; }
.code-card .icon-wrapper { background: #eff6ff; color: #3b82f6; }
.code-card .label { color: #64748b; }
.code-text { font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 2px; color: #334155; }
.copy-hint { font-size: 11px; color: #94a3b8; }
.code-card.copied { border-color: #22c55e; }
.copy-hint.success { color: #16a34a; font-weight: bold; }

/* --- TASKS --- */
.section-title { margin-bottom: 20px; font-size: 20px; font-weight: 700; color: #334155; }
.tasks-list { display: flex; flex-direction: column; gap: 20px; }

.task-card { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }

.task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.type-badge { padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.type-badge.text { background: #e0f2fe; color: #0284c7; }
.type-badge.video { background: #fce7f3; color: #be185d; }
.type-badge.test { background: #dcfce7; color: #15803d; }

.price-badge { background: #fffbeb; color: #b45309; font-weight: 800; padding: 5px 10px; border-radius: 20px; font-size: 14px; }

.task-title { font-size: 18px; margin: 0 0 15px 0; color: #0f172a; }
.task-body { margin-bottom: 20px; color: #475569; line-height: 1.5; }
.task-body p { margin-top: 0; }

/* Video */
.video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; margin-top: 15px; background: black; }
.video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.external-link { display: inline-block; margin-top: 10px; color: #3b82f6; font-weight: 600; text-decoration: none; }

/* Quiz */
.quiz-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
.quiz-btn { flex: 1; min-width: 120px; padding: 12px; background: white; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-weight: 600; color: #475569; transition: all 0.2s; }
.quiz-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

/* Footer */
.submit-btn { width: 100%; padding: 14px; background: #3b82f6; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 15px; transition: background 0.2s; }
.submit-btn:hover { background: #2563eb; }

.status-badge { text-align: center; padding: 12px; border-radius: 10px; font-weight: 600; }
.status-badge.pending { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.status-badge.completed { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

/* Animations */
.fade-in { animation: fadeIn 0.8s ease-out; }
.slide-up { opacity: 0; transform: translateY(20px); animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { to { opacity: 1; } }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

</style>