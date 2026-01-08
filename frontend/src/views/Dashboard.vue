<template>
  <div style="text-align: center; margin-top: 50px;">
    <h1>Привет! Твоя роль: {{ role }}</h1>
    <button @click="logout">Выйти</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const role = ref('');

onMounted(() => {
  role.value = localStorage.getItem('role');
});

const logout = () => {
  localStorage.clear();
  router.push('/login');
};
</script>