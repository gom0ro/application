<template>
  <div class="dashboard-container">
    
    <header class="header">
      <div class="header-content">
        <h1>Кабинет Учителя 🎓</h1>
        <button @click="logout" class="logout-btn">Выйти</button>
      </div>
    </header>

    <div class="grid-layout">
      
      <div class="left-col fade-in">
        
        <div class="card add-student">
          <h3>Добавить ученика</h3>
          <div class="input-group">
            <input v-model="inviteCode" placeholder="Код (напр. A1B2C3)" @keyup.enter="linkStudent" />
            <button @click="linkStudent" :disabled="!inviteCode">➕</button>
          </div>
        </div>

        <div class="card student-list">
          <h3>Мой класс ({{ students.length }})</h3>
          
          <div v-if="students.length === 0" class="empty">
            Пока пусто. Добавьте учеников!
          </div>

          <div 
            v-for="student in students" 
            :key="student.id" 
            class="student-item"
            :class="{ 'selected': selectedStudent?.id === student.id }"
            @click="toggleSelect(student)"
          >
            <div class="info">
              <span class="avatar">{{ student.avatar || '👶' }}</span>
              <span>{{ student.full_name || student.username }}</span>
            </div>
            
            <div class="status-icon" v-if="selectedStudent?.id === student.id">✅</div>
            <div class="coins" v-else>{{ student.coins }} 💰</div>
          </div>
        </div>
      </div>

      <div class="right-col fade-in" style="animation-delay: 0.1s;">
        <div class="card create-task">
          
          <div v-if="!selectedStudent" class="task-header blue-header">
            <h3>📢 Задание для всего класса</h3>
            <p>Это задание появится у всех учеников</p>
          </div>

          <div v-else class="task-header pink-header">
            <div class="header-row">
              <div>
                <h3>👤 Лично для: {{ selectedStudent.full_name || selectedStudent.username }}</h3>
                <p>Другие ученики это не увидят</p>
              </div>
              <button class="reset-btn" @click="selectedStudent = null">✕ Сброс</button>
            </div>
          </div>

          <div class="form-body">
            
            <div class="tabs">
              <button :class="{ active: newTask.task_type === 'text' }" @click="newTask.task_type = 'text'">📖 Текст</button>
              <button :class="{ active: newTask.task_type === 'video' }" @click="newTask.task_type = 'video'">📺 Видео</button>
              <button :class="{ active: newTask.task_type === 'test' }" @click="newTask.task_type = 'test'">❓ Тест</button>
            </div>

            <input v-model="newTask.title" class="main-input" placeholder="Название задания (обязательно)" />
            <input v-model="newTask.price" type="number" class="main-input" placeholder="Награда (монет)" />

            <div v-if="newTask.task_type === 'text'">
              <textarea v-model="newTask.description" rows="4" placeholder="Текст задания..."></textarea>
            </div>

            <div v-if="newTask.task_type === 'video'">
              <input v-model="newTask.description" class="main-input" placeholder="Описание к видео" />
              <input v-model="newTask.content" class="main-input" placeholder="Ссылка на YouTube" />
            </div>

            <div v-if="newTask.task_type === 'test'">
              <input v-model="newTask.description" class="main-input" placeholder="Вопрос" />
              <input v-model="testOptionsInput" class="main-input" placeholder="Варианты через запятую (напр: Да, Нет)" />
              <input v-model="newTask.correct_answer" class="main-input" placeholder="Правильный ответ (точно как в вариантах)" />
            </div>

            <button 
              class="submit-btn" 
              :class="{ 'pink-btn': selectedStudent }"
              @click="createTask"
            >
              {{ selectedStudent ? 'Отправить лично' : 'Опубликовать всем' }}
            </button>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const students = ref([]);
const inviteCode = ref('');
const selectedStudent = ref(null); // Кто выбран? (null = никто)
const testOptionsInput = ref('');

const newTask = reactive({
  title: '',
  price: 10,
  description: '',
  task_type: 'text',
  content: '',
  correct_answer: ''
});

// Загрузка данных
const loadData = async () => {
  try {
    const res = await api.get('/users/my-students');
    students.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

// Добавить ученика
const linkStudent = async () => {
  if (!inviteCode.value) return;
  try {
    await api.post(`/users/link-student?code=${inviteCode.value}`);
    inviteCode.value = '';
    alert('Ученик добавлен!');
    loadData();
  } catch (err) {
    alert('Ошибка: ' + (err.response?.data?.detail || 'Неверный код'));
  }
};

// Выбор ученика (клик по списку)
const toggleSelect = (student) => {
  if (selectedStudent.value?.id === student.id) {
    selectedStudent.value = null; // Снять выбор
  } else {
    selectedStudent.value = student; // Выбрать
  }
};

// Создать задание
const createTask = async () => {
  if (!newTask.title) return alert('Введите название!');
  
  if (newTask.task_type === 'test') {
    newTask.content = testOptionsInput.value;
  }

  // Самое важное: передаем ID ученика или null
  const payload = {
    ...newTask,
    student_id: selectedStudent.value ? selectedStudent.value.id : null
  };

  try {
    await api.post('/tasks/', payload);
    alert(selectedStudent.value ? 'Личное задание отправлено!' : 'Опубликовано для всех!');
    
    // Очистка формы
    newTask.title = '';
    newTask.description = '';
    newTask.content = '';
    newTask.correct_answer = '';
    testOptionsInput.value = '';
    // Не сбрасываем selectedStudent, вдруг учитель хочет дать еще одно задание тому же ученику
  } catch (err) {
    alert('Ошибка создания');
  }
};

const logout = () => {
  localStorage.removeItem('educoin_token');
  router.push('/login');
};

onMounted(loadData);
</script>

<style scoped>
/* Основной контейнер */
.dashboard-container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }

/* Шапка */
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header h1 { margin: 0; color: #333; }
.logout-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }

/* Сетка */
.grid-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }

/* Карточки */
.card { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }

/* Левая колонка */
.add-student { padding: 20px; }
.input-group { display: flex; gap: 10px; margin-top: 10px; }
.input-group input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.input-group button { background: #4f46e5; color: white; border: none; padding: 0 15px; border-radius: 6px; cursor: pointer; }

.student-list h3 { padding: 20px; margin: 0; border-bottom: 1px solid #eee; }
.student-item { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 15px 20px; border-bottom: 1px solid #f9fafb; cursor: pointer; transition: all 0.2s; 
}
.student-item:hover { background: #f3f4f6; }

/* Выбранный ученик */
.student-item.selected { background: #eff6ff; border-left: 5px solid #4f46e5; }
.info { display: flex; align-items: center; gap: 10px; font-weight: 500; }
.avatar { background: #e5e7eb; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.coins { background: #fffbeb; color: #d97706; padding: 3px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }

/* Правая колонка (Конструктор) */
.task-header { padding: 20px; color: white; transition: background 0.3s; }
.task-header h3 { margin: 0 0 5px 0; font-size: 18px; }
.task-header p { margin: 0; opacity: 0.9; font-size: 13px; }

.blue-header { background: linear-gradient(135deg, #4f46e5, #3730a3); }
.pink-header { background: linear-gradient(135deg, #db2777, #be185d); }

.header-row { display: flex; justify-content: space-between; align-items: center; }
.reset-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; cursor: pointer; padding: 5px 10px; border-radius: 20px; font-size: 12px; }
.reset-btn:hover { background: rgba(255,255,255,0.3); }

.form-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.main-input, textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-family: inherit; }
.main-input:focus, textarea:focus { outline: 2px solid #4f46e5; border-color: transparent; }

/* Табы */
.tabs { display: flex; gap: 5px; background: #f3f4f6; padding: 5px; border-radius: 8px; margin-bottom: 10px; }
.tabs button { flex: 1; border: none; background: transparent; padding: 8px; cursor: pointer; border-radius: 6px; color: #6b7280; font-weight: 600; }
.tabs button.active { background: white; color: #4f46e5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

/* Кнопка отправки */
.submit-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; transition: background 0.3s; }
.submit-btn:hover { background: #4338ca; }

/* Розовая кнопка */
.submit-btn.pink-btn { background: #db2777; }
.submit-btn.pink-btn:hover { background: #be185d; }

/* Анимация */
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>