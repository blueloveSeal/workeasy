<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="app-card">
    <div v-if="title" class="card-header">
      <div>
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      <div class="card-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-card {
  background: color-mix(in srgb, var(--bg-card) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color) 72%, transparent);
  border-radius: 20px 20px 20px 8px;
  padding: 22px;
  box-shadow: var(--shadow-card);
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms ease, border-color 220ms ease;
}

.app-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--border-color));
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin: 3px 0 0;
  letter-spacing: 0.02em;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
