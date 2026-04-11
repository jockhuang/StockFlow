<script setup lang="ts">
const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })

const props = defineProps<{
  totalElements: number
  totalPages: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  go: [page: number]
  sizeChange: []
}>()

function goTo(targetPage: number) {
  emit('go', targetPage)
}

function applySize() {
  emit('sizeChange')
}
</script>

<template>
  <footer class="pager">
    <span>Total {{ props.totalElements }}</span>
    <div class="pager-actions">
      <label class="pager-size">
        <span>Page Size</span>
        <input v-model.number="size" type="number" min="1" max="500" :disabled="props.disabled" @change="applySize" />
      </label>
      <button class="secondary-btn" :disabled="props.disabled || page <= 0" @click="goTo(0)">First</button>
      <button class="secondary-btn" :disabled="props.disabled || page <= 0" @click="goTo(page - 1)">Previous</button>
      <span>Page {{ page + 1 }} / {{ Math.max(props.totalPages, 1) }}</span>
      <button class="secondary-btn" :disabled="props.disabled || page + 1 >= props.totalPages" @click="goTo(page + 1)">Next</button>
      <button class="secondary-btn" :disabled="props.disabled || page + 1 >= props.totalPages" @click="goTo(Math.max(props.totalPages - 1, 0))">
        Last
      </button>
    </div>
  </footer>
</template>

<style scoped>
.pager-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.pager-size input {
  width: 84px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text);
  font: inherit;
}
</style>
