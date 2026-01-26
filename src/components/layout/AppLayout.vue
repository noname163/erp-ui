<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-background-light dark:bg-background-dark">
    <AppHeader />
    <div class="flex">
      <AppSidebar />
      <main class="flex-1 p-6 md:p-10">
        <slot />
      </main>
    </div>
  </div>
</template>
