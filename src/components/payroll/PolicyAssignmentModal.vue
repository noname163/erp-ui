<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { employeeService } from '@/services/employee.service'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { userProfileService } from '@/services/user-profile.service'
import { useI18n } from '@/i18n'

type EmployeeOption = {
  id: string
  code: string
  name: string
  title: string
  department: string
  avatarUrl?: string
  initials: string
}

const props = defineProps<{
  modelValue: boolean
  policyName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', selectedCodes: string[]): void
}>()
const { t } = useI18n()

const loading = ref(false)
const error = ref('')
const search = ref('')
const rows = ref<EmployeeOption[]>([])
const selectedCodes = ref<string[]>([])
const loaded = ref(false)

const seedRows: EmployeeOption[] = [
  {
    id: 'SP-9241',
    code: 'SP-9241',
    name: 'Marcus Holloway',
    title: 'Senior Engineer',
    department: 'Engineering',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuKDMRwLTeVFRIrIbsu5lMPxy8IfKpNcovsRLk-m6bh1Zhv-Lx6nb5NxpKwMmzPFs4tty-zjHb2Ulj69bkbvyynE59idTAYsQanEgqK4wq8-v9iLkCdjOLKSj3QlZWwpW3rePA_xpfQELNN_OEJ29aTZ-4qLxRUVTKPhgAmEdSK4u8tYc4GTQEHjATBZj3EKDkrrxfRFNztbrqKh_B5Q-60HAdGQh_1-0u2vAp5oVIDrU3WAXPT0M3sFjKFnXKkLqy648GK08Z_09V',
    initials: 'MH',
  },
  {
    id: 'SP-4412',
    code: 'SP-4412',
    name: 'Elena Rodriguez',
    title: 'Product Designer',
    department: 'Design',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDjKZa2tQKp5UrjplEICas3g4n3CPyFPjKK33vGB-wOT4RSSs4cq1wKQ9HCYhphDzebEbeN8cgYf7ffPq2Z0g9wOO9VeAyYU5F9AQChzS-qcfU06soNXtNDcuRI_z7RIrSSB1eB3H97pCAFvAxG4WgOm-g-VYc_KKzIqIE3ba7hXX2xPuIkLe_fEnF7TqjuQo0hlyU7QuCQMyQOkILyorpJG0bjW10xjRPisUILiYAUD47izQ-YKsfEUF5rnR20xYfca-xyxe4NDrH5',
    initials: 'ER',
  },
  {
    id: 'SP-1029',
    code: 'SP-1029',
    name: 'Julian Chen',
    title: 'Marketing Lead',
    department: 'Growth',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCewPOa7oE6x6fXKbaKY_t5iwYocDbWPgpWwBSsQmnV7i-wflNf3dtY70ggWtrwPOP8_DKpSbHhQ0egCnZf9a9lE0jkyj-1AAp2tqd6WjN4xmbkwxf7xidRHC6785dXrqZopPmvDnK0i6ftWpM2pEQ5bG_QwB5JdL9Vi13Bt_Z_UrmhiFl61StVElPpNkicLLxOPIdogmDORYR1NcyipDBSEkkn3wkgNXdBv3kFIGxHtW93Bo3m45_6r6Dxzn9idgBsLZCa_59mIHyU',
    initials: 'JC',
  },
  {
    id: 'SP-3381',
    code: 'SP-3381',
    name: 'Sarah Jenkins',
    title: 'Operations Manager',
    department: 'Operations',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCRfazNO-s0dMhcSTwntU9oR0K4xMozlfX5u0fw1olFrTjvyjf22byD25Hl3-GDBYQ6m6R4FcBqlebbnVRTqcMWogSxwQD4L7i2qTt1Sr4S5CM_k1S-R6SAgo0pE4NcdORWtmYI9hnU5BYt8qXz_w5EnSdkyrmaF4dTt21T1jM7AkXkMkQ0QJnC6tWpH7ReLW1NmLozBbS_VrDGkNYBu3WFK-AIE0y3aNsiGFORXQmcIE7UaxKWus_M_wpQJ6wDzUjii1vkb_BXFZLP',
    initials: 'SJ',
  },
  {
    id: 'SP-8820',
    code: 'SP-8820',
    name: 'Lucas Devers',
    title: 'HR Specialist',
    department: 'People',
    initials: 'LD',
  },
]

function close() {
  emit('update:modelValue', false)
}

function nameInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getString(obj: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function normalizeEmployee(payload: unknown, index: number): EmployeeOption {
  if (!payload || typeof payload !== 'object') return seedRows[index % seedRows.length]

  const item = payload as Record<string, unknown>
  const firstName = getString(item, ['firstName'])
  const lastName = getString(item, ['lastName'])
  const name = getString(item, ['fullName', 'name'], '').trim() || [firstName, lastName].filter(Boolean).join(' ') || t('policies.assignmentModal.defaults.employee', { index: index + 1 })

  return {
    id: getString(item, ['id', 'code', 'employeeCode', 'userCode'], `EMP-${index + 1}`),
    code: getString(item, ['employeeCode', 'code', 'userCode'], `EMP-${String(index + 1).padStart(4, '0')}`),
    name,
    title: getString(item, ['jobTitle', 'title', 'roleName'], t('policies.assignmentModal.defaults.teamMember')),
    department: getString(item, ['departmentName', 'department'], t('policies.assignmentModal.defaults.general')),
    avatarUrl: getString(item, ['avatarUrl', 'avatar']),
    initials: nameInitials(name),
  }
}

async function loadEmployees() {
  loading.value = true
  error.value = ''

  try {
    const response = await userProfileService.options({ page: 0, size: 100, sortDir: 'ASC' })
    const data = (response?.content ?? response?.data ?? response?.employees ?? []) as unknown[]
    rows.value = Array.isArray(data) && data.length > 0 ? data.map(normalizeEmployee) : [...seedRows]
  } catch (err: any) {
    rows.value = [...seedRows]
    error.value = err?.response?.data?.message ?? t('policies.assignmentModal.loadFailed')
  } finally {
    loading.value = false
    loaded.value = true
    if (selectedCodes.value.length === 0) {
      selectedCodes.value = rows.value.slice(0, 2).map((row) => row.code)
    }
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    search.value = ''
    if (!loaded.value) {
      void loadEmployees()
    } else if (selectedCodes.value.length === 0) {
      selectedCodes.value = rows.value.slice(0, 2).map((row) => row.code)
    }
  },
)

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return rows.value

  return rows.value.filter((row) =>
    [row.name, row.title, row.department, row.code].join(' ').toLowerCase().includes(keyword),
  )
})

const selectedCount = computed(() => selectedCodes.value.length)
const allVisibleSelected = computed(
  () => filteredRows.value.length > 0 && filteredRows.value.every((row) => selectedCodes.value.includes(row.code)),
)

function toggleEmployee(code: string, checked: boolean) {
  if (checked) {
    if (!selectedCodes.value.includes(code)) selectedCodes.value = [...selectedCodes.value, code]
    return
  }

  selectedCodes.value = selectedCodes.value.filter((value) => value !== code)
}

function toggleAllVisible(checked: boolean) {
  if (!checked) {
    const visibleCodes = new Set(filteredRows.value.map((row) => row.code))
    selectedCodes.value = selectedCodes.value.filter((code) => !visibleCodes.has(code))
    return
  }

  const next = new Set(selectedCodes.value)
  filteredRows.value.forEach((row) => next.add(row.code))
  selectedCodes.value = Array.from(next)
}

function checkboxValue(event: Event) {
  const target = event.target
  return target instanceof HTMLInputElement ? target.checked : false
}

function confirmSelection() {
  emit('confirm', selectedCodes.value)
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div class="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900">{{ t('policies.assignmentModal.title') }}</h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('policies.assignmentModal.policyLabel') }}:
              <span class="font-semibold text-primary">{{ policyName }}</span>
            </p>
          </div>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            @click="close"
          >
            <UiIcon name="close" size="20" />
          </button>
        </div>

        <div class="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div class="flex flex-col gap-3 lg:flex-row">
            <div class="flex-1">
              <UiInput
                v-model="search"
                :placeholder="t('policies.assignmentModal.searchPlaceholder')"
                leading-icon="search"
              />
            </div>
            <UiButton variant="outline" leading-icon="filter_list">{{ t('policies.assignmentModal.filters') }}</UiButton>
          </div>
          <p v-if="error" class="mt-3 text-sm text-amber-600">{{ error }}</p>
        </div>

        <div class="flex-1 overflow-auto">
          <div v-if="loading" class="px-6 py-8 text-sm text-slate-500">{{ t('policies.assignmentModal.loading') }}</div>

          <table v-else class="min-w-full border-collapse text-left">
            <thead class="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th class="w-14 border-b border-slate-200 px-6 py-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    :checked="allVisibleSelected"
                    @change="toggleAllVisible(checkboxValue($event))"
                  />
                </th>
                <th class="border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {{ t('policies.assignmentModal.headers.employee') }}
                </th>
                <th class="border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {{ t('policies.assignmentModal.headers.department') }}
                </th>
                <th class="border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {{ t('policies.assignmentModal.headers.employeeId') }}
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in filteredRows"
                :key="row.id"
                class="cursor-pointer transition-colors hover:bg-primary/5"
              >
                <td class="px-6 py-4">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    :checked="selectedCodes.includes(row.code)"
                    @change="toggleEmployee(row.code, checkboxValue($event))"
                  />
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      v-if="row.avatarUrl"
                      class="h-10 w-10 rounded-full border-2 border-white bg-cover bg-center shadow-sm"
                      :style="{ backgroundImage: `url('${row.avatarUrl}')` }"
                    ></div>
                    <div
                      v-else
                      class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-sm font-black text-primary shadow-sm"
                    >
                      {{ row.initials }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ row.name }}</p>
                      <p class="text-xs text-slate-500">{{ row.title }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                    {{ row.department }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm font-semibold text-slate-500">{{ row.code }}</td>
              </tr>

              <tr v-if="filteredRows.length === 0">
                <td colspan="4" class="px-6 py-10 text-center text-sm text-slate-500">{{ t('policies.assignmentModal.empty') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UiIcon name="group" size="20" :fill="1" />
            </div>
            <p class="text-sm font-semibold text-slate-900">
              {{ t('policies.assignmentModal.totalSelected') }}
              <span class="text-primary">{{ t('policies.assignmentModal.employees', { count: selectedCount }) }}</span>
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UiButton variant="outline" @click="close">{{ t('policies.assignmentModal.actions.cancel') }}</UiButton>
            <UiButton leading-icon="check_circle" @click="confirmSelection">{{ t('policies.assignmentModal.actions.confirmAssignment') }}</UiButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
