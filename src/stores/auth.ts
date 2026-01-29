import { defineStore } from "pinia";
import type { RoleCode, UserProfile } from "@/types";
import { authService } from "@/services/auth.service";

type AuthState = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  roles: RoleCode[];
  activeRole: RoleCode | null;
};

const LS_AUTH = "erp.auth";
const LS_ROLE = "erp.role";

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    roles: [],
    activeRole: null,
  }),
  getters: {
    availableRoles(state): RoleCode[] {
      const fromState = state.roles.length
        ? state.roles
        : (state.user?.roles ?? []);
      if (fromState.length) return fromState;
      return state.user?.role ? [state.user.role] : [];
    },
  },
  actions: {
    hydrate() {
      const raw = localStorage.getItem(LS_AUTH);
      const role = localStorage.getItem(LS_ROLE) as RoleCode | null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            isAuthenticated: boolean;
            user: UserProfile | null;
            roles?: RoleCode[];
          };
          this.isAuthenticated = !!parsed.isAuthenticated;
          this.user = parsed.user ?? null;
          this.roles = parsed.roles ?? [];
        } catch {
          // ignore
        }
      }
      this.activeRole = role;
    },
    async login(email: string, password: string) {
      const data = await authService.login({ email, password });
      const roles = extractRoles(data);
      this.roles = roles;

      // API returns JWT in cookie; response may include profile/roles depending on backend
      this.isAuthenticated = true;
      this.user = extractUser(data.data);
      localStorage.setItem(
        LS_AUTH,
        JSON.stringify({ isAuthenticated: true, user: this.user, roles }),
      );
      console.log("Auth data:", { data });
      // auto-pick role (preserve existing role if still valid)
      const existing =
        (localStorage.getItem(LS_ROLE) as RoleCode | null) ?? null;
      const nextRole =
        existing && roles.includes(existing) ? existing : (roles[0] ?? null);
      if (nextRole) this.setRole(data.role);

      return { firstLogin: !!data?.data?.firstLogin };
    },
    setRole(role: RoleCode) {
      this.activeRole = role;
      localStorage.setItem(LS_ROLE, role);
    },
    ensureRole(allowed?: RoleCode[]) {
      const available = this.availableRoles;

      if (
        this.activeRole &&
        (available.length === 0 || available.includes(this.activeRole))
      ) {
        if (!allowed || allowed.includes(this.activeRole))
          return this.activeRole;
      }

      if (!available.length) return null;

      const next =
        (allowed ? available.find((r) => allowed.includes(r)) : null) ??
        (this.activeRole && available.includes(this.activeRole)
          ? this.activeRole
          : null) ??
        available[0];

      this.setRole(next);
      return next;
    },
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      this.roles = [];
      this.activeRole = null;
      localStorage.removeItem(LS_AUTH);
      localStorage.removeItem(LS_ROLE);
    },
  },
});

const ROLE_CODES: RoleCode[] = [
  "SYSTEM_ADMIN",
  "HUMAN_RESOURCES",
  "COMPANY_MANAGER",
  "EMPLOYEE",
];

function isRoleCode(v: unknown): v is RoleCode {
  return typeof v === "string" && (ROLE_CODES as string[]).includes(v);
}

function extractRoles(data: any): RoleCode[] {
  const candidates: unknown[] = [
    data?.roles,
    data?.roleCodes,
    data?.roleCode,
    data?.role,
    data?.user?.roles,
    data?.user?.roleCodes,
    data?.user?.roleCode,
    data?.user?.role,
    data?.data?.roles,
    data?.data?.roleCodes,
    data?.data?.roleCode,
    data?.data?.role,
  ];

  const flat: unknown[] = [];
  for (const c of candidates) {
    if (Array.isArray(c)) flat.push(...c);
    else if (c != null) flat.push(c);
  }

  const roles = flat.filter(isRoleCode);
  return Array.from(new Set(roles));
}

function extractUser(data: any): UserProfile {
  const fullName = data.fullName;
  const singleRole = data.role;
  return { email: data.email, fullName, role: singleRole };
}
