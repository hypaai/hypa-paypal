export type CommerceOrderItem = {
  name: string;
  qty: number;
  unitPrice: string;
};

export type CreateCommerceOrderInput = {
  customer: {
    name: string;
    contact: string;
    language?: string;
  };
  items: CommerceOrderItem[];
  amount: string;
  currency: string;
  merchantLanguage?: string;
  source?: 'voice' | 'text' | 'image';
  surface?: 'app' | 'keyboard' | 'mcp';
  agentRequestId?: string;
};

export type UpdateCommerceOrderInput = {
  amount: string;
  items: CommerceOrderItem[];
};

export type CreateCommerceCustomerInput = {
  name: string;
  contact: string;
  language?: string;
};

export function parseCreateCustomer(value: unknown): CreateCommerceCustomerInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Customer body must be an object');
  }
  const body = value as Record<string, unknown>;
  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw new Error('Customer name is required');
  }
  if (typeof body.contact !== 'string' || !body.contact.trim()) {
    throw new Error('Customer phone or email is required');
  }
  if (body.language !== undefined && typeof body.language !== 'string') {
    throw new Error('Customer language must be a catalog language code');
  }
  return {
    name: body.name.trim(),
    contact: body.contact.trim(),
    language: body.language as string | undefined,
  };
}

const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

export function parseCreateOrder(value: unknown): CreateCommerceOrderInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Order body must be an object');
  }
  const body = value as Record<string, unknown>;
  const customer = body.customer as Record<string, unknown> | undefined;
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    throw new Error('Customer details are required');
  }
  if (typeof customer.name !== 'string' || !customer.name.trim()) {
    throw new Error('Customer name is required');
  }
  if (typeof customer.contact !== 'string' || !customer.contact.trim()) {
    throw new Error('Customer phone or email is required');
  }
  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 100
  ) {
    throw new Error('Order must contain between 1 and 100 items');
  }
  const items = body.items.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Each item must be an object');
    }
    const item = raw as Record<string, unknown>;
    if (typeof item.name !== 'string' || !item.name.trim()) {
      throw new Error('Each item needs a name');
    }
    if (!Number.isSafeInteger(item.qty) || Number(item.qty) < 1) {
      throw new Error('Item quantity must be a positive integer');
    }
    if (typeof item.unitPrice !== 'string' || !decimalPattern.test(item.unitPrice)) {
      throw new Error('Item unitPrice must be a non-negative decimal string');
    }
    return { name: item.name.trim(), qty: Number(item.qty), unitPrice: item.unitPrice };
  });
  if (typeof body.amount !== 'string' || !decimalPattern.test(body.amount)) {
    throw new Error('Amount must be a non-negative decimal string');
  }
  if (typeof body.currency !== 'string' || !/^[A-Za-z]{3}$/.test(body.currency)) {
    throw new Error('Currency must be an ISO 4217 code');
  }
  const language = (raw: unknown, field: string) => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (typeof raw !== 'string') throw new Error(`${field} must be a catalog language code`);
    return raw;
  };
  const source = body.source;
  const surface = body.surface;
  if (source !== undefined && !['voice', 'text', 'image'].includes(String(source))) {
    throw new Error('Invalid order source');
  }
  if (surface !== undefined && !['app', 'keyboard', 'mcp'].includes(String(surface))) {
    throw new Error('Invalid order surface');
  }
  return {
    customer: {
      name: customer.name.trim(),
      contact: customer.contact.trim(),
      language: language(customer.language, 'Customer language'),
    },
    items,
    amount: body.amount,
    currency: body.currency.toUpperCase(),
    merchantLanguage: language(body.merchantLanguage, 'Merchant language'),
    source: source as CreateCommerceOrderInput['source'],
    surface: surface as CreateCommerceOrderInput['surface'],
  };
}

export function parseUpdateOrder(value: unknown): UpdateCommerceOrderInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Order update must be an object');
  }
  const body = value as Record<string, unknown>;
  if (typeof body.amount !== 'string' || !decimalPattern.test(body.amount)) {
    throw new Error('Amount must be a non-negative decimal string');
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    throw new Error('Order must contain between 1 and 100 items');
  }
  const items = body.items.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Each item must be an object');
    const item = raw as Record<string, unknown>;
    if (typeof item.name !== 'string' || !item.name.trim()) throw new Error('Each item needs a name');
    if (!Number.isSafeInteger(item.qty) || Number(item.qty) < 1) throw new Error('Item quantity must be a positive integer');
    if (typeof item.unitPrice !== 'string' || !decimalPattern.test(item.unitPrice)) {
      throw new Error('Item unitPrice must be a non-negative decimal string');
    }
    return { name: item.name.trim(), qty: Number(item.qty), unitPrice: item.unitPrice };
  });
  return { amount: body.amount, items };
}
