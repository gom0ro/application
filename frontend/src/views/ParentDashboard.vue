<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-content">
        <h1>Кабинет Родителя 🛡️</h1>
        <button @click="logout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <div class="grid-layout">

      <div class="column left-col fade-in">
        
        <div class="card add-child">
          <h3>🔗 Добавить ребенка</h3>
          <div class="input-group">
            <input 
              v-model="childCode" 
              placeholder="Код ребенка (напр. X7Z99A)" 
              @keyup.enter="linkChild"
            />
            <button @click="linkChild">Добавить</button>
          </div>
        </div>

        <div class="card children-list">
          <h3>Мои дети</h3>
          <div v-if="children.length === 0" class="empty">Нет детей</div>
          
          <div v-else class="child-item" v-for="child in children" :key="child.id">
            <div class="child-info">
              <span class="avatar">{{ child.avatar || '👶' }}</span>
              <div>
                <div class="name">{{ child.full_name || child.username }}</div>
                <div class="coins">{{ child.coins }} ₸</div>
              </div>
            </div>
            
            <div class="manual-action">
              <input v-model.number="amountToPay[child.id]" type="number" placeholder="± Сумма" class="mini-input" />
              <button @click="manualPayout(child.id)" title="Списать/Выдать вручную">💸</button>
            </div>
          </div>
        </div>
      </div>

      <div class="column right-col fade-in" style="animation-delay: 0.1s;">
        
        <div v-if="payouts.length > 0" class="card kaspi-alert">
          <div class="card-header-red">
            <h3>🏦 Заявки на вывод (Kaspi)</h3>
            <p>Дети ждут перевод на карту</p>
          </div>
          
          <div class="list-body">
            <div v-for="req in payouts" :key="req.id" class="payout-row">
              <div class="payout-info">
                <span class="amount-red">- {{ req.amount }} ₸</span>
                <div class="details">
                  <strong>Кому:</strong> {{ getChildName(req.user_id) }}<br>
                  <strong>Номер:</strong> {{ req.phone_number }}
                </div>
              </div>
              <button class="confirm-btn" @click="confirmPayment(req.id)">
                Я перевел ✅
              </button>
            </div>
          </div>
        </div>

        <div class="card tasks-review">
          <div class="card-header-blue">
            <h3>📬 Задания на проверке</h3>
            <p>Подтвердите выполнение</p>
          </div>

          <div v-if="pendingTasks.length === 0" class="empty-state">
            Всё проверено! ✅
          </div>

          <div v-else class="list-body">
            <div v-for="task in pendingTasks" :key="task.id" class="task-row">
              <div class="task-info">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-child">От: {{ getChildName(task.student_id) }}</span>
                <span class="task-price">+{{ task.price }} ₸</span>
              </div>
              <button class="approve-btn" @click="approveTask(task.id)">
                Одобрить 👍
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const childCode = ref('');
const children = ref([]);
const tasks = ref([]);
const payouts = ref([]); // Заявки на вывод
const amountToPay = reactive({});

// Фильтр только непроверенных задач
const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending'));

// ЗАГРУЗКА ВСЕХ ДАННЫХ
const loadData = async () => {
  try {
    // 1. Дети
    const childrenRes = await api.get('/users/my-children');
    children.value = childrenRes.data;

    // 2. Задачи (Всех детей)
    const tasksRes = await api.get('/tasks/');
    tasks.value = tasksRes.data;

    // 3. Заявки на вывод (Kaspi)
    const payoutsRes = await api.get('/users/payouts/pending');
    payouts.value = payoutsRes.data;

  } catch (err) {
    console.error("Ошибка загрузки данных", err);
  }
};

// --- ФУНКЦИИ ---

// Добавить ребенка
const linkChild = async () => {
  if (!childCode.value) return;
  try {
    await api.post(`/users/link-child?code=${childCode.value}`);
    alert('Ребенок добавлен!');
    childCode.value = '';
    loadData();
  } catch (err) {
    alert('Ошибка: ' + (err.response?.data?.detail || 'Неверный код'));
  }
};

// Одобрить задание
const approveTask = async (taskId) => {
  try {
    await api.post(`/tasks/${taskId}/approve`);
    // Убираем из списка локально, чтобы не ждать загрузки
    tasks.value = tasks.value.filter(t => t.id !== taskId);
    // Но лучше обновить всё, чтобы баланс ребенка пересчитался
    setTimeout(loadData, 500); 
  } catch (err) {
    alert('Ошибка: ' + err.response?.data?.detail);
  }
};

// Подтвердить перевод Kaspi
const confirmPayment = async (payoutId) => {
  const isConfirmed = confirm("Вы действительно перевели деньги через приложение банка?");
  if (!isConfirmed) return;

  try {
    await api.post(`/users/payouts/${payoutId}/confirm`);
    alert('Заявка закрыта!');
    loadData();
  } catch (err) {
    alert('Ошибка сервера');
  }
};

// Ручное списание (старая функция, оставим на всякий случай)
const manualPayout = async (childId) => {
  const amount = amountToPay[childId];
  if (!amount) return;
  try {
    await api.post(`/users/${childId}/payout?amount=${amount}`);
    amountToPay[childId] = '';
    loadData();
    alert('Баланс изменен вручную');
  } catch (err) {
    alert('Ошибка');
  }
};

// Помощник: Получить имя ребенка по ID
const getChildName = (id) => {
  const child = children.value.find(c => c.id === id);
  return child ? (child.full_name || child.username) : 'Неизвестно';
};

const logout = () => {
  localStorage.removeItem('educoin_token');
  router.push('/login');
};

onMounted(loadData);
</script>

<style scoped>
.dashboard-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }

/* Header */
.header { display: flex; justify-content: flex-end; margin-bottom: 20px; }
.header-content { display: flex; align-items: center; gap: 20px; width: 100%; justify-content: space-between; }
.logout-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

.grid-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }

/* Cards */
.card { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }
.card h3 { margin: 0; padding: 15px; border-bottom: 1px solid #f3f4f6; font-size: 16px; }

/* Добавление ребенка */
.input-group { display: flex; padding: 15px; gap: 10px; }
.input-group input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
.input-group button { background: #4f46e5; color: white; border: none; padding: 0 15px; border-radius: 6px; cursor: pointer; }

/* Список детей */
.child-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #f9fafb; }
.child-info { display: flex; gap: 10px; align-items: center; }
.avatar { font-size: 24px; background: #f3f4f6; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.name { font-weight: 600; font-size: 14px; }
.coins { color: #d97706; font-weight: bold; font-size: 13px; }
.mini-input { width: 60px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; margin-right: 5px; text-align: center; }

/* 🟥 KASPI CARD */
.kaspi-alert { border-color: #fca5a5; }
.card-header-red { background: #fef2f2; padding: 15px; color: #991b1b; border-bottom: 1px solid #fee2e2; }
.card-header-red h3 { border: none; padding: 0; margin-bottom: 2px; }
.card-header-red p { margin: 0; font-size: 12px; opacity: 0.8; }

.payout-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #fef2f2; }
.amount-red { color: #dc2626; font-weight: 800; font-size: 18px; margin-right: 15px; }
.details { font-size: 13px; color: #4b5563; }
.confirm-btn { background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.confirm-btn:hover { background: #15803d; }

/* 🟦 TASKS CARD */
.card-header-blue { background: #eff6ff; padding: 15px; color: #1e40af; border-bottom: 1px solid #dbeafe; }
.card-header-blue h3 { border: none; padding: 0; margin-bottom: 2px; }
.card-header-blue p { margin: 0; font-size: 12px; opacity: 0.8; }

.task-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #f1f5f9; }
.task-info { display: flex; flex-direction: column; gap: 2px; }
.task-title { font-weight: 600; color: #1f2937; }
.task-child { font-size: 12px; color: #6b7280; }
.task-price { color: #16a34a; font-weight: bold; font-size: 12px; }
.approve-btn { background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; }
.approve-btn:hover { background: #4338ca; }

.empty-state { padding: 30px; text-align: center; color: #9ca3af; font-style: italic; }
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>