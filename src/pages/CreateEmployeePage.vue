<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { employeeService, type CreateEmployeeRequest } from '@/services/employee.service'
import { departmentService } from '@/services/department.service'
import { AppRoute, type RoleCode } from '@/types'

const router = useRouter()

const loading = ref(false)
const loadingDepartments = ref(false)
const error = ref('')
const success = ref('')

const form = ref<CreateEmployeeRequest>({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    email: '',
    phone: '',
    departmentCode: '',
    roleCode: 'EMPLOYEE',
})

const fieldErrors = ref<Partial<Record<keyof CreateEmployeeRequest, string>>>({})

const roleOptions = [
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'HUMAN_RESOURCES', label: 'Human Resource' },
    { value: 'COMPANY_MANAGER', label: 'Company Manager' },
] satisfies { value: RoleCode; label: string }[]

const departmentOptions = ref<{ value: string; label: string }[]>([])

const canSubmit = computed(() => !loading.value && !loadingDepartments.value)

function validate() {
    const nextErrors: Partial<Record<keyof CreateEmployeeRequest, string>> = {}
    if (!form.value.firstName.trim()) nextErrors.firstName = 'First name is required'
    if (!form.value.lastName.trim()) nextErrors.lastName = 'Last name is required'
    if (!form.value.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) nextErrors.email = 'Invalid email'
    if (!form.value.phone.trim()) nextErrors.phone = 'Phone is required'
    if (!form.value.departmentCode) nextErrors.departmentCode = 'Department is required'
    if (!form.value.roleCode) nextErrors.roleCode = 'Role is required'
    if (!form.value.gender) nextErrors.gender = 'Gender is required'

    fieldErrors.value = nextErrors
    return Object.keys(nextErrors).length === 0
}

async function loadDepartments() {
    loadingDepartments.value = true
    try {
        const res = await departmentService.list({ page: 0, size: 200 })
        const items = (res?.content ?? res?.data ?? []) as Array<{ code?: string; name?: string }>
        departmentOptions.value = items
            .filter((d) => d?.code && d?.name)
            .map((d) => ({ value: d.code as string, label: d.name as string }))
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Load departments failed'
    } finally {
        loadingDepartments.value = false
    }
}

function resetForm() {
    form.value = {
        firstName: '',
        lastName: '',
        gender: 'MALE',
        email: '',
        phone: '',
        departmentCode: '',
        roleCode: 'EMPLOYEE',
    }
    fieldErrors.value = {}
    error.value = ''
    success.value = ''
}

async function submit() {
    error.value = ''
    success.value = ''
    if (!validate()) return

    loading.value = true
    try {
        await employeeService.create({
            ...form.value,
            firstName: form.value.firstName.trim(),
            lastName: form.value.lastName.trim(),
            email: form.value.email.trim(),
            phone: form.value.phone.trim(),
        })
        success.value = 'Employee created'
        router.push(AppRoute.HR_OVERVIEW)
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Create employee failed'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadDepartments()
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-5xl mx-auto">
            <div class="flex items-center gap-2 mb-6">
                <button class="text-slate-500 text-sm font-medium hover:text-primary"
                    @click="router.push(AppRoute.HR_OVERVIEW)">HR</button>
                <UiIcon name="chevron_right" size="16px" class="text-slate-400" />
                <span class="text-slate-900 dark:text-white text-sm font-semibold">Create New Employee</span>
            </div>

            <div class="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-3xl font-bold">Create New Employee</h1>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employees</p>
                </div>
                <div class="flex gap-3">
                    <UiButton variant="outline" :disabled="loading" @click="router.push(AppRoute.HR_OVERVIEW)">Cancel
                    </UiButton>
                    <UiButton variant="primary" :disabled="!canSubmit" @click="submit">
                        <span v-if="loading">Saving...</span>
                        <span v-else>Save Employee</span>
                    </UiButton>
                </div>
            </div>

            <div class="ui-card">
                <form class="p-6 md:p-8 space-y-10" @submit.prevent="submit">
                    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
                    <div v-if="success" class="text-sm text-green-600">{{ success }}</div>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">Personal Information</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiInput v-model="form.firstName" label="First Name" required placeholder="e.g. John"
                                :error="fieldErrors.firstName" />
                            <UiInput v-model="form.lastName" label="Last Name" required placeholder="e.g. Doe"
                                :error="fieldErrors.lastName" />

                            <div class="md:col-span-1">
                                <p class="ui-label">Gender <span class="text-primary">*</span></p>
                                <div class="flex gap-6 mt-2">
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="MALE" />
                                        <span>Male</span>
                                    </label>
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="FEMALE" />
                                        <span>Female</span>
                                    </label>
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="OTHER" />
                                        <span>Other</span>
                                    </label>
                                </div>
                                <p v-if="fieldErrors.gender" class="text-xs text-red-500 mt-1">{{ fieldErrors.gender }}
                                </p>
                            </div>

                            <UiInput v-model="form.email" label="Email Address" required type="email"
                                placeholder="john.doe@enterprise.com" :error="fieldErrors.email" />
                        </div>
                    </section>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">Job Details</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiSelect v-model="form.departmentCode" label="Department" required
                                placeholder="Select Department" :options="departmentOptions"
                                :disabled="loadingDepartments" :error="fieldErrors.departmentCode" />
                            <UiSelect v-model="form.roleCode" label="Role" required placeholder="Select Role"
                                :options="roleOptions" :error="fieldErrors.roleCode" />
                        </div>
                    </section>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">Contact Information</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiInput v-model="form.phone" label="Phone Number" required placeholder="+84 123 456 789"
                                :error="fieldErrors.phone" hint="Include country code if applicable." />
                        </div>
                    </section>

                    <div class="flex items-center justify-between gap-4 pt-4">
                        <button type="button" class="text-slate-500 hover:text-primary text-sm font-medium"
                            :disabled="loading" @click="resetForm">
                            Reset Form
                        </button>
                        <UiButton type="submit" variant="primary" :disabled="!canSubmit">Create Employee Account
                        </UiButton>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
