<script setup lang="ts">
export type UiTableHeader = {
  key: string
  label: string
  thClass?: string
  tdClass?: string
  align?: 'left' | 'center' | 'right'
}

type Props = {
  headers: UiTableHeader[]
  rows: any[]
  rowKey?: string | ((row: any, index: number) => string | number)
  emptyText?: string
  headRowClass?: string
  rowClass?: string | ((row: any, index: number) => string)
  thBaseClass?: string
  tdBaseClass?: string
  wrapperClass?: string
  tableClass?: string
  headClass?: string
  bodyClass?: string
  scroll?: boolean
}

withDefaults(defineProps<Props>(), {
  headers: () => [],
  rows: () => [],
  rowKey: undefined,
  emptyText: 'No data',
  headRowClass: '',
  rowClass: '',
  thBaseClass: 'px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider',
  tdBaseClass: 'px-6 py-4 whitespace-nowrap',
  wrapperClass: '',
  tableClass: '',
  headClass: '',
  bodyClass: '',
  scroll: true,
})

function alignClass(align?: UiTableHeader['align']) {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function resolveRowKey(row: any, index: number, rowKey?: Props['rowKey']) {
  if (!rowKey) return index
  if (typeof rowKey === 'function') return rowKey(row, index)
  return row?.[rowKey] ?? index
}

function resolveRowClass(row: any, index: number, rowClass?: Props['rowClass']) {
  if (!rowClass) return ''
  if (typeof rowClass === 'function') return rowClass(row, index)
  return rowClass
}
</script>

<template>
  <div :class="[scroll ? 'overflow-x-auto' : '', wrapperClass]">
    <table class="w-full text-left text-sm" :class="tableClass">
      <thead class="bg-slate-50 dark:bg-slate-800/50" :class="headClass">
        <tr :class="headRowClass">
          <th
            v-for="h in headers"
            :key="h.key"
            :class="[thBaseClass, alignClass(h.align), h.thClass ?? '']"
          >
            {{ h.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800" :class="bodyClass">
        <tr v-if="rows.length === 0">
          <td :colspan="headers.length || 1" class="px-6 py-6 text-sm text-slate-500">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>

        <tr
          v-for="(row, rowIndex) in rows"
          :key="resolveRowKey(row as any, rowIndex, rowKey)"
          :class="resolveRowClass(row as any, rowIndex, rowClass)"
        >
          <td
            v-for="h in headers"
            :key="h.key"
            :class="[tdBaseClass, alignClass(h.align), h.tdClass ?? '']"
          >
            <slot
              :name="`cell-${h.key}`"
              :row="row"
              :value="(row as any)?.[h.key]"
              :header="h"
              :index="rowIndex"
            >
              {{ (row as any)?.[h.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
