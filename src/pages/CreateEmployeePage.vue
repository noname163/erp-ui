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
import { roleService } from '@/services/role.service'
import { useI18n } from '@/i18n'
import { AppRoute } from '@/types'

const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const loadingDepartments = ref(false)
const loadingRoles = ref(false)
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

const roleOptions = ref<{ value: string; label: string }[]>([])

const departmentOptions = ref<{ value: string; label: string }[]>([])

const canSubmit = computed(() => !loading.value && !loadingDepartments.value && !loadingRoles.value)

function validate() {
    const nextErrors: Partial<Record<keyof CreateEmployeeRequest, string>> = {}
    if (!form.value.firstName.trim()) nextErrors.firstName = t('employees.create.validation.firstNameRequired')
    if (!form.value.lastName.trim()) nextErrors.lastName = t('employees.create.validation.lastNameRequired')
    if (!form.value.email.trim()) nextErrors.email = t('employees.create.validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) nextErrors.email = t('employees.create.validation.invalidEmail')
    if (!form.value.phone.trim()) nextErrors.phone = t('employees.create.validation.phoneRequired')
    if (!form.value.departmentCode) nextErrors.departmentCode = t('employees.create.validation.departmentRequired')
    if (!form.value.roleCode) nextErrors.roleCode = t('employees.create.validation.roleRequired')
    if (!form.value.gender) nextErrors.gender = t('employees.create.validation.genderRequired')

    fieldErrors.value = nextErrors
    return Object.keys(nextErrors).length === 0
}

async function loadDepartments() {
    loadingDepartments.value = true
    try {
        const res = await departmentService.options()
    const items = (res ?? []) as Array<{ code?: string; name?: string }>
    departmentOptions.value = items
            .filter((d) => d?.code && d?.name)
            .map((d) => ({ value: d.code as string, label: d.name as string }))
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? t('employees.create.loadDepartmentsFailed')
    } finally {
        loadingDepartments.value = false
    }
}

async function loadRoles() {
    loadingRoles.value = true
    try {
        const res = await roleService.options()
        const items = (res ?? []) as Array<{ code?: string; name?: string }>
        roleOptions.value = items
            .filter((r) => r?.code && r?.name)
            .map((r) => ({ value: r.code as string, label: r.name as string }))

        if (!roleOptions.value.some((r) => r.value === form.value.roleCode)) {
            form.value.roleCode = roleOptions.value[0]?.value ?? ''
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? t('employees.create.loadRolesFailed')
    } finally {
        loadingRoles.value = false
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
        success.value = t('employees.create.successCreated')
        router.push(AppRoute.EMPLOYEES)
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? t('employees.create.createFailed')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadDepartments()
    loadRoles()
})
</script>

<template>
    <AppLayout>
        <div class="w-full max-w-5xl mx-auto">
            <div class="flex items-center gap-2 mb-6">
                <button class="text-slate-500 text-sm font-medium hover:text-primary"
                    @click="router.push(AppRoute.EMPLOYEES)">{{ t('employees.create.breadcrumb') }}</button>
                <UiIcon name="chevron_right" size="16px" class="text-slate-400" />
                <span class="text-slate-900 dark:text-white text-sm font-semibold">{{ t('employees.create.title') }}</span>
            </div>

            <div class="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-3xl font-bold">{{ t('employees.create.title') }}</h1>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">POST /api/employees</p>
                </div>
                <div class="flex gap-3">
                    <UiButton variant="outline" :disabled="loading" @click="router.push(AppRoute.EMPLOYEES)">{{ t('common.action.cancel') }}
                    </UiButton>
                    <UiButton variant="primary" :disabled="!canSubmit" @click="submit">
                        <span v-if="loading">{{ t('common.state.saving') }}</span>
                        <span v-else>{{ t('employees.create.saveEmployee') }}</span>
                    </UiButton>
                </div>
            </div>

            <div class="ui-card">
                <form class="p-6 md:p-8 space-y-10" @submit.prevent="submit">
                    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
                    <div v-if="success" class="text-sm text-green-600">{{ success }}</div>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">{{ t('employees.create.sections.personalInformation') }}</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiInput v-model="form.firstName" :label="t('common.field.firstName')" required :placeholder="t('employees.create.fields.firstName.placeholder')"
                                :error="fieldErrors.firstName" />
                            <UiInput v-model="form.lastName" :label="t('common.field.lastName')" required :placeholder="t('employees.create.fields.lastName.placeholder')"
                                :error="fieldErrors.lastName" />

                            <div class="md:col-span-1">
                                <p class="ui-label">{{ t('common.field.gender') }} <span class="text-primary">*</span></p>
                                <div class="flex gap-6 mt-2">
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="MALE" />
                                        <span>{{ t('common.gender.male') }}</span>
                                    </label>
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="FEMALE" />
                                        <span>{{ t('common.gender.female') }}</span>
                                    </label>
                                    <label class="flex items-center gap-2 text-sm">
                                        <input v-model="form.gender" type="radio" class="h-4 w-4 accent-primary"
                                            value="OTHER" />
                                        <span>{{ t('common.gender.other') }}</span>
                                    </label>
                                </div>
                                <p v-if="fieldErrors.gender" class="text-xs text-red-500 mt-1">{{ fieldErrors.gender }}
                                </p>
                            </div>

                            <UiInput v-model="form.email" :label="t('common.field.email')" required type="email"
                                :placeholder="t('employees.create.fields.email.placeholder')" :error="fieldErrors.email" />
                        </div>
                    </section>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">{{ t('employees.create.sections.jobDetails') }}</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiSelect v-model="form.departmentCode" :label="t('common.field.department')" required
                                :placeholder="t('employees.create.fields.department.placeholder')" :options="departmentOptions"
                                :disabled="loadingDepartments" :error="fieldErrors.departmentCode" />
                            <UiSelect v-model="form.roleCode" :label="t('common.field.role')" required :placeholder="t('employees.create.fields.role.placeholder')"
                                :options="roleOptions" :disabled="loadingRoles" :error="fieldErrors.roleCode" />
                        </div>
                    </section>

                    <section class="space-y-5">
                        <div>
                            <h2 class="text-lg font-bold">{{ t('employees.create.sections.contactInformation') }}</h2>
                            <div class="h-px bg-primary/10 mt-4" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UiInput v-model="form.phone" :label="t('common.field.phoneNumber')" required :placeholder="t('employees.create.fields.phone.placeholder')"
                                :error="fieldErrors.phone" :hint="t('employees.create.fields.phone.hint')" />
                        </div>
                    </section>

                    <div class="flex items-center justify-between gap-4 pt-4">
                        <button type="button" class="text-slate-500 hover:text-primary text-sm font-medium"
                            :disabled="loading" @click="resetForm">
                            {{ t('employees.create.resetForm') }}
                        </button>
                        <UiButton type="submit" variant="primary" :disabled="!canSubmit">{{ t('employees.create.createAccount') }}
                        </UiButton>
                    </div>
                </form>
            </div>
        </div>
    </AppLayout>
</template>
