import { http } from "./http";

export type SalaryMethod = "FIXED" | "PERCENT" | "FORMULA" | "PLUS" | "MINUS";

export type SalaryRequest = {
  name: string;
  calculateMethod: string;
  isDeduct: boolean;
};

export type SalaryTemplateTotalLine = {
  salaryCode: string;
  amount: string;
  quantity?: string;
  dependencyCode?: string;
};

export type SalaryTemplateDetailRequest = SalaryTemplateTotalLine & {
  quantity: string;
  unitCode: string;
  sequenceOrder: string;
};

export type SalaryTemplateRequest = {
  name: string;
  description?: string;
  totalAmount: string;
  effectiveFrom: string;
  effectiveTo: string;
  currency?: string;
  details: SalaryTemplateDetailRequest[];
};

export type SelectionOptionResponse = { code: string; name: string };

export type SelectionOptionQuery = {
  type?: string;
  name?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
};

export type SalaryTemplateSummary = {
  code?: string;
  name: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  currency?: string;
  totalAmount: string | number;
  createdBy?: string;
};

export type SalaryTemplateListQuery = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  name?: string;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

export type SalaryTemplateOptionResponse = { code: string; name: string };

export type SalaryTemplateDetailResponse = SalaryTemplateTotalLine & {
  quantity?: string;
  unitCode?: string;
  sequenceOrder?: string;
};

export type SalaryComponentRule = {
  code: string;
  name: string;
  calculateMethod: SalaryMethod;
  isDeduct: boolean;
};

export const salaryService = {
  async listComponents(params?: Record<string, any>) {
    const { data } = await http.get("/api/salaries", { params });
    return data;
  },
  async createComponents(req: SalaryRequest[]) {
    const { data } = await http.post('/api/salaries', req)
    return data
  },
  async componentRules(params?: Record<string, any>) {
    const data = await this.listComponents(params);
    return normalizeSalaryComponentRules(data);
  },
  async createTemplate(req: SalaryTemplateRequest) {
    const response = await http.post("/api/salary-templates", req);
    return {
      status: response.status,
      data: response.data,
    };
  },
  async salaryOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SelectionOptionResponse[] | any>(
      "/api/salaries/options",
      { params },
    );
    return data;
  },
  async systemUnitOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SelectionOptionResponse[] | any>(
      "/api/system-units/options",
      { params },
    );
    return data;
  },
  async listTemplates(query: SalaryTemplateListQuery = {}) {
    const { data } = await http.get("/api/salary-templates", { params: query });
    return data;
  },
  async templateOptions(params?: SelectionOptionQuery) {
    const { data } = await http.get<SalaryTemplateOptionResponse[] | any>(
      "/api/salary-templates/options",
      { params },
    );
    return data;
  },
  async templateDetails(salaryTemplateCode: string) {
    const { data } = await http.get<SalaryTemplateDetailResponse[] | any>(
      `/api/salary-templates/${salaryTemplateCode}/details`,
    );
    return data;
  },
};

export function normalizeSalaryComponentRules(payload: unknown): SalaryComponentRule[] {
  const collection = unwrapArray(payload);

  return collection
    .map((item: any): SalaryComponentRule | null => {
      const code = firstString(item?.code, item?.salaryCode, item?.name);
      if (!code) return null;

      return {
        code,
        name: firstString(item?.name, code),
        calculateMethod: normalizeSalaryMethod(item?.calculateMethod),
        isDeduct: Boolean(item?.isDeduct),
      };
    })
    .filter((item: SalaryComponentRule | null): item is SalaryComponentRule => Boolean(item));
}

export function normalizeSalaryTemplateTotalLines(payload: unknown): SalaryTemplateTotalLine[] {
  const collection = unwrapArray(payload);

  return collection
    .map((item: any): SalaryTemplateTotalLine | null => {
      const salaryCode = firstString(item?.salaryCode, item?.code);
      if (!salaryCode) return null;

      return {
        salaryCode,
        amount: firstString(item?.amount, "0"),
        quantity: firstString(item?.quantity, "1"),
        dependencyCode: firstString(item?.dependencyCode),
      };
    })
    .filter((item: SalaryTemplateTotalLine | null): item is SalaryTemplateTotalLine => Boolean(item));
}

export function calculateSalaryTemplateTotal(
  details: SalaryTemplateTotalLine[],
  rules: SalaryComponentRule[],
) {
  const ruleMap = new Map(rules.map((rule) => [rule.code, rule] as const));
  const detailEntries = details.map((detail, index) => ({
    ...detail,
    quantity: detail.quantity?.trim() || "1",
    _key: `${detail.salaryCode}:${index}`,
  }));
  const detailMap = new Map(detailEntries.map((detail) => [detail.salaryCode, detail] as const));
  const cache = new Map<string, string>();
  const resolving = new Set<string>();

  return sumDecimalStrings(detailEntries.map(resolveLineAmount));

  function resolveLineAmount(detail: (typeof detailEntries)[number]): string {
    const cached = cache.get(detail._key);
    if (cached !== undefined) return cached;
    if (resolving.has(detail._key)) return "0";

    resolving.add(detail._key);

    const rule = ruleMap.get(detail.salaryCode);
    const quantity = detail.quantity?.trim() || "1";
    const rawAmount = multiplyDecimalStrings(detail.amount, quantity);
    let resolvedAmount = rawAmount;

    if (rule?.calculateMethod === "PERCENT" && detail.dependencyCode) {
      const dependencyDetail = detailMap.get(detail.dependencyCode);
      const dependencyAmount = dependencyDetail ? resolveLineAmount(dependencyDetail) : "0";
      resolvedAmount = calculatePercentageAmount(dependencyAmount, rawAmount);
    }

    if (rule?.calculateMethod === "PLUS") {
      resolvedAmount = absoluteDecimalString(resolvedAmount);
    }
    if (rule?.calculateMethod === "MINUS") {
      resolvedAmount = negateAbsoluteDecimalString(resolvedAmount);
    }
    if (rule?.isDeduct) {
      resolvedAmount = negateAbsoluteDecimalString(resolvedAmount);
    }

    cache.set(detail._key, resolvedAmount);
    resolving.delete(detail._key);

    return resolvedAmount;
  }
}

function unwrapArray(payload: unknown) {
  if (Array.isArray(payload)) return payload;

  const record = payload as Record<string, unknown> | null;
  if (!record) return [];

  const candidate = [record.content, record.data, record.items, record.details]
    .find(Array.isArray);

  return Array.isArray(candidate) ? candidate : [];
}

function normalizeSalaryMethod(value: unknown): SalaryMethod {
  const normalized = firstString(value).toUpperCase();
  if (normalized === "PERCENT") return "PERCENT";
  if (normalized === "FORMULA") return "FORMULA";
  if (normalized === "PLUS") return "PLUS";
  if (normalized === "MINUS") return "MINUS";
  return "FIXED";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }

  return "";
}

type DecimalValue = {
  sign: 1 | -1;
  digits: string;
  scale: number;
};

function parseDecimal(input: unknown): DecimalValue {
  const raw = String(input ?? "").trim();
  if (!raw) return { sign: 1, digits: "0", scale: 0 };

  const sign = raw.startsWith("-") ? -1 : 1;
  const unsigned = raw.replace(/^[+-]/, "");
  const [wholeRaw, fractionalRaw = ""] = unsigned.split(".");
  const whole = (wholeRaw || "0").replace(/[^0-9]/g, "") || "0";
  const fractional = fractionalRaw.replace(/[^0-9]/g, "");
  const digits = `${whole}${fractional}`.replace(/^0+(?=\d)/, "") || "0";

  return {
    sign,
    digits,
    scale: fractional.length,
  };
}

function toScaledBigInt(value: DecimalValue, targetScale: number) {
  const scaleDiff = Math.max(0, targetScale - value.scale);
  const factor = scaleDiff > 0 ? BigInt(`1${"0".repeat(scaleDiff)}`) : 1n;
  const magnitude = BigInt(value.digits || "0") * factor;
  return value.sign === -1 ? -magnitude : magnitude;
}

function formatScaledBigInt(value: bigint, scale: number) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const digits = absolute.toString();

  if (scale <= 0) return `${negative ? "-" : ""}${digits}`;

  const padded = digits.padStart(scale + 1, "0");
  const whole = padded.slice(0, -scale) || "0";
  const fraction = padded.slice(-scale).replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function sumDecimalStrings(values: string[]) {
  if (values.length === 0) return "0";

  const parsed = values.map(parseDecimal);
  const scale = parsed.reduce((max, value) => Math.max(max, value.scale), 0);
  const total = parsed.reduce((sum, value) => sum + toScaledBigInt(value, scale), 0n);

  return formatScaledBigInt(total, scale);
}

function multiplyDecimalStrings(left: string, right: string) {
  const parsedLeft = parseDecimal(left);
  const parsedRight = parseDecimal(right);
  const sign = parsedLeft.sign * parsedRight.sign;
  const magnitude = BigInt(parsedLeft.digits || "0") * BigInt(parsedRight.digits || "0");
  const scale = parsedLeft.scale + parsedRight.scale;

  return formatScaledBigInt(sign === -1 ? -magnitude : magnitude, scale);
}

function calculatePercentageAmount(base: string, percent: string) {
  const parsedBase = parseDecimal(base);
  const parsedPercent = parseDecimal(percent);
  const sign = parsedBase.sign * parsedPercent.sign;
  const magnitude = BigInt(parsedBase.digits || "0") * BigInt(parsedPercent.digits || "0");
  const scale = parsedBase.scale + parsedPercent.scale + 2;

  return formatScaledBigInt(sign === -1 ? -magnitude : magnitude, scale);
}

function absoluteDecimalString(value: string) {
  return value.trim().replace(/^-/, "") || "0";
}

function negateAbsoluteDecimalString(value: string) {
  const absolute = absoluteDecimalString(value);
  if (absolute === "0") return "0";
  return `-${absolute}`;
}
