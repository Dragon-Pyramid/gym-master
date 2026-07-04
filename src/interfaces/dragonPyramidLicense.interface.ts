export type DragonPyramidLicenseStatus =
  | 'active'
  | 'trial'
  | 'grace'
  | 'suspended'
  | 'cancelled';

export type DragonPyramidClientPaymentStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'grace'
  | 'suspended_candidate'
  | 'unknown';

export type DragonPyramidLicenseControl = {
  id: string;
  singleton_key: 'principal';
  product_code: string;
  client_code: string;
  client_name: string;
  license_status: DragonPyramidLicenseStatus;
  payment_status: DragonPyramidClientPaymentStatus;
  last_payment_at: string | null;
  next_due_at: string | null;
  expected_amount: number | null;
  currency: string | null;
  billing_plan: string | null;
  payment_notes: string | null;
  activated_at: string | null;
  expires_at: string | null;
  grace_until: string | null;
  suspended_at: string | null;
  reactivated_at: string | null;
  suspension_reason: string | null;
  last_checked_at: string | null;
  sync_source: string | null;
  metadata: Record<string, unknown>;
  creado_en: string;
  actualizado_en: string;
};

export type DragonPyramidLicenseUpdateInput = {
  client_code?: string;
  client_name?: string;
  license_status?: DragonPyramidLicenseStatus;
  payment_status?: DragonPyramidClientPaymentStatus;
  last_payment_at?: string | null;
  next_due_at?: string | null;
  expected_amount?: number | string | null;
  currency?: string | null;
  billing_plan?: string | null;
  payment_notes?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  grace_until?: string | null;
  suspended_at?: string | null;
  reactivated_at?: string | null;
  suspension_reason?: string | null;
  sync_source?: string | null;
  metadata?: Record<string, unknown>;
};
