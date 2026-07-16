import { api, API_BASE_URL } from "./axios";

export type CoreResponse<T> = {
  success: boolean;
  status_code: number;
  message: string;
  content: T;
};

// Se cambia T | CoreResponse<T> por unknown para evitar conflictos de unión en TypeScript
function unwrap<T>(data: unknown): T {
  return typeof data === "object" && data != null && "content" in data
    ? (data as CoreResponse<T>).content
    : (data as T);
}

export function getPhotoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

export type WorkshopInput = {
  name: string;
  rif: string;
  address: string;
  latitude?: number;
  longitude?: number;
  verification_document?: File;
  photo?: File;
};

export type Workshop = {
  id: string;
  name: string;
  rif: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  owner_id: string;
  is_certified: boolean;
  is_suspended: number;
  average_rating: number;
  verification_document_url: string | null;
  photo_url: string | null;
  created_at: string;
};

type WorkshopListContent = {
  workshops: Workshop[];
};

export type GetWorkshopsParams = {
  search?: string;
  certified_only?: boolean;
  city?: string;
  min_rating?: number;
};

export async function getWorkshops(params?: GetWorkshopsParams): Promise<Workshop[]> {
  const res = await api.get("/workshops", {
    params: {
      certified_only: true,
      ...params,
    },
  });
  const body = unwrap<Workshop[] | WorkshopListContent>(res.data);
  if (Array.isArray(body)) return body;
  return body.workshops;
}

export async function getMyWorkshops(): Promise<Workshop[]> {
  const res = await api.get("/workshops", { params: { owned: true } });
  const body = unwrap<Workshop[] | WorkshopListContent>(res.data);
  if (Array.isArray(body)) return body;
  return body.workshops;
}

export async function createWorkshop(input: WorkshopInput): Promise<Workshop> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("rif", input.rif);
  formData.append("address", input.address);
  if (input.latitude != null) formData.append("latitude", String(input.latitude));
  if (input.longitude != null) formData.append("longitude", String(input.longitude));
  if (input.verification_document) {
    formData.append("verification_document", input.verification_document);
  }
  if (input.photo) {
    formData.append("photo", input.photo);
  }

  const res = await api.post("/workshops", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrap<Workshop>(res.data);
}

export async function updateWorkshop(id: string, input: Partial<WorkshopInput>): Promise<Workshop> {
  const formData = new FormData();
  if (input.name != null) formData.append("name", input.name);
  if (input.address != null) formData.append("address", input.address);
  if (input.latitude != null) formData.append("latitude", String(input.latitude));
  if (input.longitude != null) formData.append("longitude", String(input.longitude));
  if (input.verification_document) {
    formData.append("verification_document", input.verification_document);
  }
  if (input.photo) {
    formData.append("photo", input.photo);
  }

  const res = await api.put(`/workshops/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<Workshop>(res.data);
}

export async function deleteWorkshop(id: string): Promise<void> {
  await api.delete(`/workshops/${id}`);
}

export async function toggleWorkshopSuspension(id: string): Promise<Workshop> {
  const res = await api.post(`/workshops/${id}/toggle-suspension`);
  return unwrap<Workshop>(res.data);
}

export async function uploadWorkshopPhoto(id: string, photo: File): Promise<Workshop> {
  const formData = new FormData();
  formData.append("photo", photo);
  const res = await api.post(`/workshops/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<Workshop>(res.data);
}

export async function deleteWorkshopPhoto(id: string): Promise<Workshop> {
  const res = await api.delete(`/workshops/${id}/photo`);
  return unwrap<Workshop>(res.data);
}

export type AdminWorkshop = Workshop & {
  owner_name: string;
  is_suspended: number;
};

export type VerificationRequest = {
  id: string;
  owner_id: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  name: string;
  rif: string;
  address: string;
  verification_document_url: string | null;
  created_at: string;
};

export async function getPendingVerifications(): Promise<VerificationRequest[]> {
  const res = await api.get("/workshops/verifications/pending");
  const body = unwrap<{ requests: VerificationRequest[] }>(res.data);
  return body.requests ?? [];
}

export async function certifyWorkshop(id: string): Promise<Workshop> {
  const res = await api.post(`/workshops/${id}/certify`);
  return unwrap<Workshop>(res.data);
}

export type VehicleType = "CAR" | "MOTORCYCLE";

export type CreateVehicleInput = {
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin?: string;
};

export type UpdateVehicleInput = Partial<
  Pick<CreateVehicleInput, "vehicle_type" | "brand" | "model" | "year">
>;

export type Vehicle = {
  id: string;
  owner_id: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
};

type VehicleListContent = {
  vehicles: Vehicle[];
};

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const res = await api.get("/vehicles/types");
  const body = unwrap<VehicleType[] | { types: VehicleType[] }>(res.data);
  if (Array.isArray(body)) return body;
  return body.types;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get("/vehicles");
  const body = unwrap<VehicleListContent>(res.data);
  return body.vehicles;
}

export async function uploadVehiclePhoto(id: string, file: File): Promise<Vehicle> {
  const form = new FormData();
  form.append("photo", file);
  const res = await api.put(`/vehicles/${id}/photo`, form);
  return unwrap<Vehicle>(res.data);
}

export async function deleteVehiclePhoto(id: string): Promise<Vehicle> {
  const res = await api.delete(`/vehicles/${id}/photo`);
  return unwrap<Vehicle>(res.data);
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const res = await api.post("/vehicles", input);
  return unwrap<Vehicle>(res.data);
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const res = await api.get(`/vehicles/${id}`);
  return unwrap<Vehicle>(res.data);
}

export async function updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  const res = await api.put(`/vehicles/${id}`, input);
  return unwrap<Vehicle>(res.data);
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}

export type OrderItemDTO = {
  id: string;
  part_id: string;
  part_name: string;
  quantity: number;
  unit_price: number;
};

export type OrderRatingInfo = {
  client_rating: number | null;
  client_rated: boolean;
  workshop_rating: number | null;
  workshop_rated: boolean;
};

export type OrderDTO = {
  id: string;
  vehicle_id: string;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  installment_count: number;
  status: string;
  items: OrderItemDTO[];
  closed_by_client: boolean;
  closed_by_workshop: boolean;
  created_at: string;
  workshop_id?: string;
  workshop_name?: string;
  workshop_rif?: string | null;
  workshop_address?: string | null;
  user_first_name?: string;
  user_last_name?: string;
  user_ci?: string;
  user_email?: string;
  delivery_method?: string;
  delivery_address?: string | null;
  delivery_fee?: number;
  reference_number?: string | null;
  tracking_number?: string | null;
  shipping_notes?: string | null;
  shipped_at?: string | null;
  ratings: OrderRatingInfo;
};

export type InstallmentDTO = {
  id: string;
  order_id: string;
  amount: number;
  due_date: string;
  payment_method: string;
  reference_number: string | null;
  status: string;
  paid_at: string | null;
  rate: number | null;
  rate_date: string | null;
};

export type ServiceOrderRatingInfo = {
  client_rating: number | null;
  client_rated: boolean;
  client_review: string | null;
  workshop_rating: number | null;
  workshop_rated: boolean;
  workshop_review: string | null;
};

export type ServiceOrderPaymentDTO = {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  status: string;
  paid_at: string | null;
  rate: number | null;
  rate_date: string | null;
  created_at: string;
};

export type ServiceOrderInstallmentDTO = {
  id: string;
  amount: number;
  due_date: string;
  payment_method: string;
  reference_number: string | null;
  status: string;
  paid_at: string | null;
  rate: number | null;
  rate_date: string | null;
  created_at: string;
  late_fee_status: string | null;
  late_fee_amount: number | null;
};

export type ServiceOrderDTO = {
  id: string;
  workshop_id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  workshop_name: string | null;
  workshop_rif: string | null;
  workshop_address: string | null;
  vehicle_id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_license_plate: string;
  user_first_name: string;
  user_last_name: string;
  user_ci: string;
  user_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_ci: string | null;
  owner_email: string | null;
  user_client_rating: number | null;
  user_client_rating_count: number | null;
  status: string;
  base_price: number;
  final_price: number | null;
  extra_charge: number;
  extra_charge_note: string | null;
  extra_charge_status: string;
  price_min: number | null;
  price_max: number | null;
  notes: string | null;
  delivery_method: string;
  delivery_address: string | null;
  delivery_fee: number | null;
  tracking_number: string | null;
  shipping_notes: string | null;
  shipped_at: string | null;
  closed_by_client: boolean;
  closed_by_workshop: boolean;
  revision: number | null;
  is_paid: boolean;
  is_financed: boolean;
  down_payment_pct: number | null;
  payment_status: string | null;
  created_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  ratings: ServiceOrderRatingInfo;
  payments: ServiceOrderPaymentDTO[];
  installments: ServiceOrderInstallmentDTO[];
};

export type WorkshopSaleDTO = {
  id: string;
  part_id: string;
  user_id: string;
  workshop_id: string;
  vehicle_id: string;
  mileage: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  installment_count: number;
  status: string;
  created_at: string;
};

export async function getMyOrders(): Promise<OrderDTO[]> {
  const res = await api.get("/orders/mine");
  const body = unwrap<{ orders: OrderDTO[] }>(res.data);
  return body.orders;
}

export async function getWorkshop(id: string): Promise<Workshop> {
  const res = await api.get(`/workshops/${id}`);
  return unwrap<Workshop>(res.data);
}

// ===== Parts / Marketplace =====

export type PartDTO = {
  id: string;
  workshop_id: string;
  workshop_name: string;
  workshop_is_certified: boolean;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  condition: string;
  category: string | null;
  allows_installments: 0 | 1;
  installment_min_percentage: number;
  photo_url: string | null;
  is_active: 0 | 1;
  created_at: string;
};

export async function getPartCategories(): Promise<string[]> {
  const res = await api.get("/parts/categories");
  const body = unwrap<{ categories: string[] }>(res.data);
  return body.categories;
}

export async function getPartConditions(): Promise<string[]> {
  const res = await api.get("/parts/conditions");
  const body = unwrap<{ categories: string[] }>(res.data);
  return body.categories;
}

export type CreatePartInput = {
  workshop_id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  condition: "NEW" | "USED";
  category?: string | null;
  allows_installments?: 0 | 1;
  installment_min_percentage?: number;
};

export async function createPart(input: CreatePartInput): Promise<PartDTO> {
  const res = await api.post("/parts", input);
  return unwrap<PartDTO>(res.data);
}

export type GetPartsParams = {
  query?: string;
  category?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  workshop_id?: string;
  certified_only?: boolean;
  offset?: number;
  limit?: number;
};

export async function getParts(params?: GetPartsParams): Promise<PartDTO[]> {
  const res = await api.get("/parts", { params });
  const body = unwrap<{ parts: PartDTO[] }>(res.data);
  return body.parts;
}

export async function getWorkshopParts(
  workshopId: string,
  params?: { offset?: number; limit?: number },
): Promise<PartDTO[]> {
  const res = await api.get(`/parts/workshop/${workshopId}`, { params });
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "parts" in content) return content.parts;
  return [];
}

export async function getPart(id: string): Promise<PartDTO> {
  const res = await api.get(`/parts/${id}`);
  return unwrap<PartDTO>(res.data);
}

export type UpdatePartInput = {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  condition?: "NEW" | "USED";
  category?: string | null;
  allows_installments?: 0 | 1;
  installment_min_percentage?: number;
  is_active?: 0 | 1;
};

export async function updatePart(id: string, input: UpdatePartInput): Promise<PartDTO> {
  const res = await api.put(`/parts/${id}`, input);
  return unwrap<PartDTO>(res.data);
}

export async function deletePart(id: string): Promise<void> {
  await api.delete(`/parts/${id}`);
}

export async function uploadPartPhoto(id: string, file: File): Promise<PartDTO> {
  const form = new FormData();
  form.append("photo", file);
  const res = await api.post(`/parts/${id}/photo`, form);
  return unwrap<PartDTO>(res.data);
}

export async function deletePartPhoto(id: string): Promise<PartDTO> {
  const res = await api.delete(`/parts/${id}/photo`);
  return unwrap<PartDTO>(res.data);
}

export type CartItemDTO = {
  id: string;
  part_id: string;
  part_name: string;
  part_price: number;
  workshop_id: string;
  workshop_name: string;
  quantity: number;
  subtotal: number;
  allows_installments: boolean;
  installment_min_percentage: number;
};

export type CartDTO = {
  id: string;
  items: CartItemDTO[];
  total: number;
};

export async function getCart(): Promise<CartDTO> {
  const res = await api.get("/cart");
  return unwrap<CartDTO>(res.data);
}

export async function addToCart(partId: string, quantity: number): Promise<CartDTO> {
  const res = await api.post("/cart/add", { part_id: partId, quantity });
  return unwrap<CartDTO>(res.data);
}

export async function updateCartItem(itemId: string, quantity: number): Promise<void> {
  await api.put(`/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: string): Promise<void> {
  await api.delete(`/cart/items/${itemId}`);
}

export async function clearCart(): Promise<void> {
  await api.delete("/cart");
}

export type CheckoutItemInput = {
  cart_item_id: string;
  down_payment_percentage?: number;
};

export type WorkshopCheckoutInput = {
  workshop_id: string;
  delivery_method: "PICKUP" | "SHIPPING";
  delivery_address?: string | null;
  reference_number?: string;
  payment_method_id?: string;
  items: CheckoutItemInput[];
};

export type CheckoutInput = {
  vehicle_id?: string;
  mileage?: number;
  workshops: WorkshopCheckoutInput[];
};

export async function checkout(input: CheckoutInput): Promise<OrderDTO[]> {
  const res = await api.post("/orders/checkout", input);
  const body = unwrap<{ orders: OrderDTO[] }>(res.data);
  return body.orders;
}

export async function getOrderInstallments(orderId: string): Promise<InstallmentDTO[]> {
  const res = await api.get(`/orders/${orderId}/installments`);
  const body = unwrap<{ installments: InstallmentDTO[] }>(res.data);
  return body.installments;
}

export type PayInstallmentInput = {
  payment_method: string;
  reference_number?: string;
  rate?: number | null;
  rate_date?: string | null;
  paid_at?: string | null;
};

export async function payInstallment(
  installmentId: string,
  input: PayInstallmentInput,
): Promise<InstallmentDTO> {
  const res = await api.post(`/orders/installments/${installmentId}/pay`, input);
  return unwrap<InstallmentDTO>(res.data);
}

export async function markInstallmentPaid(
  installmentId: string,
  input: { reference_number?: string | null; paid_at?: string | null },
): Promise<InstallmentDTO> {
  const res = await api.post(`/orders/installments/${installmentId}/mark-paid`, input);
  return unwrap<InstallmentDTO>(res.data);
}

export async function markInstallmentErroneous(
  installmentId: string,
): Promise<InstallmentDTO> {
  const res = await api.post(`/orders/installments/${installmentId}/mark-erroneous`);
  return unwrap<InstallmentDTO>(res.data);
}

export type PaymentAccountDTO = {
  id: string;
  account_type: string;
  bank_name: string;
  holder_document: string;
  account_number: string | null;
  account_holder: string | null;
  phone_number: string | null;
  is_active: boolean;
};

export type CreatePaymentAccountInput = {
  account_type: string;
  bank_name: string;
  holder_document: string;
  account_number?: string | null;
  account_holder?: string | null;
  phone_number?: string | null;
};

export async function getMyPaymentAccounts(): Promise<PaymentAccountDTO[]> {
  const res = await api.get("/payments/accounts/mine");
  const body = unwrap<{ accounts: PaymentAccountDTO[] }>(res.data);
  return body.accounts;
}

export async function createPaymentAccount(
  input: CreatePaymentAccountInput,
): Promise<PaymentAccountDTO> {
  const res = await api.post("/payments/accounts", input);
  return unwrap<PaymentAccountDTO>(res.data);
}

export async function updatePaymentAccount(
  id: string,
  input: Partial<CreatePaymentAccountInput>,
): Promise<PaymentAccountDTO> {
  const res = await api.put(`/payments/accounts/${id}`, input);
  return unwrap<PaymentAccountDTO>(res.data);
}

export async function deletePaymentAccount(id: string): Promise<void> {
  await api.delete(`/payments/accounts/${id}`);
}

export async function getWorkshopSales(
  workshopId: string,
  params?: { offset?: number; limit?: number },
): Promise<WorkshopSaleDTO[]> {
  const res = await api.get(`/parts/workshop/${workshopId}/sales`, { params });
  const body = unwrap<{ purchases: WorkshopSaleDTO[] }>(res.data);
  return body.purchases;
}

// ===== Workshop Bank Accounts & Mobile Payments =====

export async function getWorkshopBanks(): Promise<string[]> {
  const res = await api.get("/workshops/banks");
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "banks" in content)
    return (content as { banks: string[] }).banks;
  return [];
}

export type BankAccountDTO = {
  id: string;
  workshop_id: string;
  account_number: string;
  holder_ci: string;
  bank_name: string;
  is_active: 0 | 1;
};

export async function getWorkshopBankAccounts(workshopId: string): Promise<BankAccountDTO[]> {
  const res = await api.get(`/workshops/${workshopId}/bank-accounts`);
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "bank_accounts" in content)
    return content.bank_accounts;
  return [];
}

export type CreateBankAccountInput = {
  account_number: string;
  holder_ci: string;
  bank_name: string;
};

export async function createBankAccount(
  workshopId: string,
  input: CreateBankAccountInput,
): Promise<BankAccountDTO> {
  const res = await api.post(`/workshops/${workshopId}/bank-accounts`, input);
  return unwrap<BankAccountDTO>(res.data);
}

export type UpdateBankAccountInput = Partial<CreateBankAccountInput> & {
  is_active?: 0 | 1;
};

export async function updateBankAccount(
  workshopId: string,
  accountId: string,
  input: UpdateBankAccountInput,
): Promise<BankAccountDTO> {
  const res = await api.put(`/workshops/${workshopId}/bank-accounts/${accountId}`, input);
  return unwrap<BankAccountDTO>(res.data);
}

export async function deleteBankAccount(workshopId: string, accountId: string): Promise<void> {
  await api.delete(`/workshops/${workshopId}/bank-accounts/${accountId}`);
}

export type MobilePaymentDTO = {
  id: string;
  workshop_id: string;
  phone_number: string;
  bank_name: string;
  holder_ci: string;
  is_active: 0 | 1;
};

export type PaymentMethodType = "bank_transfer" | "mobile_payment" | "cash" | "zelle" | "zinli";

export type WorkshopPaymentMethodDTO = {
  id: string;
  workshop_id: string;
  type: PaymentMethodType;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  phone_number: string | null;
  holder_ci: string | null;
  email: string | null;
  is_active: 0 | 1;
  created_at: string;
};

export type CreatePaymentMethodInput = {
  type: PaymentMethodType;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder?: string | null;
  phone_number?: string | null;
  holder_ci?: string | null;
  email?: string | null;
};

export type UpdatePaymentMethodInput = Partial<CreatePaymentMethodInput> & {
  is_active?: 0 | 1;
};

export async function getWorkshopMobilePayments(workshopId: string): Promise<MobilePaymentDTO[]> {
  const res = await api.get(`/workshops/${workshopId}/mobile-payments`);
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "mobile_payments" in content)
    return content.mobile_payments;
  return [];
}

export type CreateMobilePaymentInput = {
  phone_number: string;
  bank_name: string;
  holder_ci: string;
};

export async function createMobilePayment(
  workshopId: string,
  input: CreateMobilePaymentInput,
): Promise<MobilePaymentDTO> {
  const res = await api.post(`/workshops/${workshopId}/mobile-payments`, input);
  return unwrap<MobilePaymentDTO>(res.data);
}

export type UpdateMobilePaymentInput = Partial<CreateMobilePaymentInput> & {
  is_active?: 0 | 1;
};

export async function updateMobilePayment(
  workshopId: string,
  paymentId: string,
  input: UpdateMobilePaymentInput,
): Promise<MobilePaymentDTO> {
  const res = await api.put(`/workshops/${workshopId}/mobile-payments/${paymentId}`, input);
  return unwrap<MobilePaymentDTO>(res.data);
}

export async function deleteMobilePayment(workshopId: string, paymentId: string): Promise<void> {
  await api.delete(`/workshops/${workshopId}/mobile-payments/${paymentId}`);
}

export async function getWorkshopPaymentMethods(
  workshopId: string,
): Promise<WorkshopPaymentMethodDTO[]> {
  const res = await api.get(`/workshops/${workshopId}/payment-methods`);
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "payment_methods" in content)
    return content.payment_methods;
  return [];
}

export async function createPaymentMethod(
  workshopId: string,
  input: CreatePaymentMethodInput,
): Promise<WorkshopPaymentMethodDTO> {
  const res = await api.post(`/workshops/${workshopId}/payment-methods`, input);
  return unwrap<WorkshopPaymentMethodDTO>(res.data);
}

export async function updatePaymentMethod(
  workshopId: string,
  methodId: string,
  input: UpdatePaymentMethodInput,
): Promise<WorkshopPaymentMethodDTO> {
  const res = await api.put(`/workshops/${workshopId}/payment-methods/${methodId}`, input);
  return unwrap<WorkshopPaymentMethodDTO>(res.data);
}

export async function deletePaymentMethod(workshopId: string, methodId: string): Promise<void> {
  await api.delete(`/workshops/${workshopId}/payment-methods/${methodId}`);
}

// ===== Services =====

export type ServiceDTO = {
  id: string;
  workshop_id: string;
  service_name: string;
  service_type: string | null;
  standard_price_min: number;
  standard_price_max: number;
  revision_cost_min: number | null;
  revision_cost_max: number | null;
  vehicle_type: string | null;
  created_at: string;
};

export type CreateServiceInput = {
  workshop_id: string;
  service_name: string;
  service_type?: string | null;
  standard_price_min: number;
  standard_price_max: number;
  revision_cost_min?: number | null;
  revision_cost_max?: number | null;
  vehicle_type?: string | null;
};

export async function createService(input: CreateServiceInput): Promise<ServiceDTO> {
  const res = await api.post("/services", input);
  return unwrap<ServiceDTO>(res.data);
}

export type GetServicesParams = {
  query?: string;
  min_price?: number;
  max_price?: number;
  certified_only?: boolean;
  service_type?: string;
  offset?: number;
  limit?: number;
};

export async function getServices(params?: GetServicesParams): Promise<ServiceDTO[]> {
  const res = await api.get("/services", { params });
  const body = unwrap<{ services: ServiceDTO[] }>(res.data);
  return body.services;
}

export async function getWorkshopServices(workshopId: string): Promise<ServiceDTO[]> {
  const res = await api.get(`/services/workshop/${workshopId}`);
  const data = res.data;
  const content =
    data && typeof data === "object" && "content" in data ? (data as any).content : data;
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object" && "services" in content) return content.services;
  return [];
}

export async function getService(id: string): Promise<ServiceDTO> {
  const res = await api.get(`/services/${id}`);
  return unwrap<ServiceDTO>(res.data);
}

export type UpdateServiceInput = {
  service_name?: string;
  service_type?: string | null;
  standard_price_min?: number;
  standard_price_max?: number;
  revision_cost_min?: number | null;
  revision_cost_max?: number | null;
  vehicle_type?: string | null;
};

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceDTO> {
  const res = await api.put(`/services/${id}`, input);
  return unwrap<ServiceDTO>(res.data);
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

// ===== Orders / Checkout helpers =====

export async function getOrder(orderId: string): Promise<OrderDTO> {
  const res = await api.get(`/orders/${orderId}`);
  return unwrap<OrderDTO>(res.data);
}

export async function confirmOrderPayment(
  orderId: string,
  input: { reference_number: string },
): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/confirm-payment`, input);
  return unwrap<OrderDTO>(res.data);
}

export async function confirmOrderReceived(orderId: string): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/confirm-received`);
  return unwrap<OrderDTO>(res.data);
}

export async function getWorkshopOrders(workshopId: string): Promise<WorkshopOrderDTO[]> {
  const res = await api.get(`/orders/workshop/${workshopId}`);
  const body = unwrap<{ orders: WorkshopOrderDTO[] }>(res.data);
  return body.orders;
}

export async function updateOrderStatus(
  orderId: string,
  input: { status: string },
): Promise<OrderDTO> {
  const res = await api.put(`/orders/${orderId}/status`, input);
  return unwrap<OrderDTO>(res.data);
}

export async function getAllWorkshopOrders(): Promise<WorkshopOrderDTO[]> {
  const res = await api.get("/orders/workshops/all");
  const body = unwrap<{ orders: WorkshopOrderDTO[] }>(res.data);
  return body.orders;
}

export type WorkshopOrderDTO = {
  id: string;
  user_id: string;
  vehicle_id: string;
  mileage: number;
  total_amount: number;
  status: string;
  delivery_method: string;
  delivery_address: string | null;
  delivery_fee: number;
  reference_number: string | null;
  confirmed_at: string | null;
  closed_by_client: boolean;
  closed_by_workshop: boolean;
  has_pending_verification: boolean;
  items: OrderItemDTO[];
  created_at: string;
  ratings: OrderRatingInfo;
};

export async function markOrderReceived(orderId: string): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/mark-received`);
  return unwrap<OrderDTO>(res.data);
}

export async function closeOrderAsWorkshop(orderId: string): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/close-workshop`);
  return unwrap<OrderDTO>(res.data);
}

export type RateOrderRequest = {
  rating: number;
  comment?: string;
};

export async function rateOrderWorkshop(
  orderId: string,
  input: RateOrderRequest,
): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/rate-workshop`, input);
  return unwrap<OrderDTO>(res.data);
}

export async function rateOrderClient(orderId: string, input: RateOrderRequest): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/rate-client`, input);
  return unwrap<OrderDTO>(res.data);
}

// ===== Workshop Services Orders =====

export async function getServiceOrders(): Promise<ServiceOrderDTO[]> {
  const res = await api.get("/services/orders/mine");
  const body = unwrap<{ service_orders: ServiceOrderDTO[] }>(res.data);
  return body.service_orders;
}

export async function getWorkshopServiceOrders(workshopId: string): Promise<ServiceOrderDTO[]> {
  const res = await api.get(`/services/orders/workshop/${workshopId}`);
  const body = unwrap<{ service_orders: ServiceOrderDTO[] }>(res.data);
  return body.service_orders;
}

export async function createServiceOrder(input: {
  workshop_id: string;
  service_id: string;
  vehicle_id: string;
  notes?: string;
}): Promise<ServiceOrderDTO> {
  const res = await api.post("/services/orders", input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function updateServiceOrderStatus(
  orderId: string,
  input: { status: string },
): Promise<ServiceOrderDTO> {
  const res = await api.put(`/services/orders/${orderId}/status`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function addServiceExtraCharge(
  orderId: string,
  input: { extra_charge: number; extra_charge_note?: string },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/extra-charge`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function approveServiceExtra(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/approve-extra`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function rejectServiceExtra(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/reject-extra`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function getServiceOrder(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.get(`/services/orders/${orderId}`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceAtWorkshop(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-at-workshop`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function setServiceRevision(
  orderId: string,
  input: { revision_cost: number },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/set-revision`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function acceptServiceRevision(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/accept-revision`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function rejectServiceRevision(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/reject-revision`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function setServiceQuote(
  orderId: string,
  input: { final_price: number; notes?: string },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/set-quote`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function acceptServiceQuote(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/accept-quote`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function rejectServiceQuote(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/reject-quote`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceDelivered(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-delivered`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceInProgress(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-in-progress`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceCompleted(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-completed`);
  return unwrap<ServiceOrderDTO>(res.data);
}

// ===== Workshop Ratings =====

export async function rateWorkshop(
  workshopId: string,
  input: { rating: number; comment?: string },
): Promise<void> {
  await api.post(`/workshops/${workshopId}/ratings`, input);
}

export async function cancelServiceOrder(orderId: string): Promise<void> {
  await api.post(`/services/orders/${orderId}/cancel`);
}

export async function markServiceShipped(
  orderId: string,
  input: { tracking_number: string; shipping_notes?: string },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-shipped`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceReceived(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-received`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceDroppedOff(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/mark-dropped-off`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function closeServiceAsClient(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/close-client`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function closeServiceAsWorkshop(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/close-workshop`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function payServiceOrder(
  orderId: string,
  input: {
    payment_method: string;
    reference_number?: string;
    rate?: number | null;
    rate_date?: string | null;
  },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/pay`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function confirmServicePayment(orderId: string): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/confirm-payment`);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function rateServiceOrderWorkshop(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/rate-workshop`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function rateServiceOrderClient(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/rate-client`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markOrderShipped(
  orderId: string,
  input: { tracking_number: string; shipping_notes?: string },
): Promise<OrderDTO> {
  const res = await api.post(`/orders/${orderId}/mark-shipped`, input);
  return unwrap<OrderDTO>(res.data);
}

// ===== Services for clients =====

export type ServiceWithWorkshop = ServiceDTO & {
  workshop_name?: string;
  workshop_address?: string;
  workshop_photo_url?: string;
  workshop_certified?: boolean;
  workshop_rating?: number;
};

export async function getServicesWithWorkshops(
  params?: GetServicesParams & { service_type?: string; workshop_id?: string },
): Promise<ServiceWithWorkshop[]> {
  const res = await api.get("/services/with-workshops", { params });
  const body = unwrap<{ services: ServiceWithWorkshop[] }>(res.data);
  return body.services;
}

// --- Admin API ---

export type AdminStats = {
  total_users: number;
  total_workshops: number;
  total_certified_workshops: number;
  total_parts: number;
  total_vehicles: number;
  total_sales: number;
  total_revenue: number;
  total_financed: number;
  total_credit_limit: number;
  total_credit_available: number;
  total_financing: number;
};

export type AdminUser = {
  id: string;
  email: string;
  roles: string[];
  first_name: string;
  last_name: string;
  ci: string;
  phone: string | null;
  photo_url: string | null;
  is_suspended: number;
  created_at: string;
};

export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get("/admin/stats");
  return unwrap<AdminStats>(res.data);
}

export async function adminListUsers(search?: string): Promise<AdminUser[]> {
  const res = await api.get("/admin/users", { params: { search } });
  const body = unwrap<{ users: AdminUser[] }>(res.data);
  return body.users;
}

export async function adminGetUser(id: string): Promise<AdminUser> {
  const res = await api.get(`/admin/users/${id}`);
  return unwrap<AdminUser>(res.data);
}

export type AdminUpdateUserInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  roles?: string[];
  is_suspended?: number;
};

export async function adminUpdateUser(id: string, input: AdminUpdateUserInput): Promise<AdminUser> {
  const res = await api.put(`/admin/users/${id}`, input);
  return unwrap<AdminUser>(res.data);
}

export async function adminDeleteUser(id: string, force?: boolean): Promise<void> {
  await api.delete(`/admin/users/${id}`, { params: { force: force ? "true" : undefined } });
}

export async function adminGetOpenOrders(
  kind: "users" | "workshops" | "vehicles",
  id: string,
): Promise<{ open_orders: number }> {
  const res = await api.get(`/admin/${kind}/${id}/open-orders`);
  const body = unwrap<{ open_orders: number }>(res.data);
  return body;
}

export async function adminListWorkshops(search?: string): Promise<AdminWorkshop[]> {
  const res = await api.get("/admin/workshops", { params: { search } });
  const body = unwrap<{ workshops: AdminWorkshop[] }>(res.data);
  return body.workshops;
}

export type AdminUpdateWorkshopInput = {
  name?: string;
  address?: string;
  rif?: string;
  is_certified?: number;
  is_suspended?: number;
};

export async function adminUpdateWorkshop(
  id: string,
  input: AdminUpdateWorkshopInput,
): Promise<Workshop> {
  const res = await api.put(`/admin/workshops/${id}`, input);
  return unwrap<Workshop>(res.data);
}

export async function adminDeleteWorkshop(id: string, force?: boolean): Promise<void> {
  await api.delete(`/admin/workshops/${id}`, { params: { force: force ? "true" : undefined } });
}

export type AdminPart = PartDTO & { workshop_name: string; deleted_at: string | null };

export async function adminListParts(
  search?: string,
  includeDeleted?: boolean,
): Promise<AdminPart[]> {
  const res = await api.get("/admin/parts", {
    params: { search, include_deleted: includeDeleted },
  });
  const body = unwrap<{ parts: AdminPart[] }>(res.data);
  return body.parts;
}

export type AdminUpdatePartInput = {
  name?: string;
  price?: number;
  stock?: number;
  is_active?: number;
};

export async function adminUpdatePart(id: string, input: AdminUpdatePartInput): Promise<PartDTO> {
  const res = await api.put(`/admin/parts/${id}`, input);
  return unwrap<PartDTO>(res.data);
}

export async function adminDeletePart(id: string): Promise<void> {
  await api.delete(`/admin/parts/${id}`);
}

export async function adminRestorePart(id: string): Promise<void> {
  await api.patch(`/admin/parts/${id}/restore`);
}

export type AdminVehicle = {
  id: string;
  owner_id: string;
  owner_name: string | null;
  owner_ci: string | null;
  owner_email: string | null;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  photo_url: string | null;
  is_active: number;
  created_at: string;
};

export async function adminListVehicles(search?: string): Promise<AdminVehicle[]> {
  const res = await api.get("/admin/vehicles", { params: { search } });
  const body = unwrap<{ vehicles: AdminVehicle[] }>(res.data);
  return body.vehicles;
}

export type AdminUpdateVehicleInput = {
  brand?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  vehicle_type?: string;
  is_active?: number;
};

export async function adminUpdateVehicle(
  id: string,
  input: AdminUpdateVehicleInput,
): Promise<Vehicle> {
  const res = await api.put(`/admin/vehicles/${id}`, input);
  return unwrap<Vehicle>(res.data);
}

export async function adminDeleteVehicle(id: string): Promise<void> {
  await api.delete(`/admin/vehicles/${id}`);
}

export type AdminOrder = {
  id: string;
  user_id: string;
  buyer_name: string;
  buyer_ci: string | null;
  vehicle_id: string;
  workshop_name: string;
  mileage: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_type: string;
  installment_count: number;
  installments_paid: number;
  installments_pending_verification: number;
  installments_pending: number;
  created_at: string;
};

export async function adminListOrders(search?: string, status?: string): Promise<AdminOrder[]> {
  const res = await api.get("/admin/orders", { params: { search, status } });
  const body = unwrap<{ orders: AdminOrder[] }>(res.data);
  return body.orders;
}

export async function adminDeleteOrder(id: string): Promise<void> {
  await api.delete(`/admin/orders/${id}`);
}

export async function adminDeleteServiceOrder(id: string): Promise<void> {
  await api.delete(`/admin/service-orders/${id}`);
}

export async function adminCancelOrder(id: string): Promise<void> {
  const res = await api.patch(`/admin/orders/${id}/cancel`);
  const body = unwrap<CoreResponse<null>>(res.data);
  if (!body.success) {
    throw new Error(body.message || "Error al cancelar orden");
  }
}

export type AdminServiceOrder = {
  id: string;
  user_id: string;
  workshop_id: string;
  service_name: string;
  workshop_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_ci: string | null;
  status: string;
  base_price: number;
  final_price: number | null;
  created_at: string;
};

export async function adminListServiceOrders(
  search?: string,
  status?: string,
): Promise<AdminServiceOrder[]> {
  const res = await api.get("/admin/service-orders", { params: { search, status } });
  const body = unwrap<{ service_orders: AdminServiceOrder[] }>(res.data);
  return body.service_orders;
}

export type AdminServiceOrderDetailDTO = ServiceOrderDTO & {
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_email: string | null;
  owner_ci: string | null;
};

export async function adminGetServiceOrder(orderId: string): Promise<AdminServiceOrderDetailDTO> {
  const res = await api.get(`/services/orders/admin/${orderId}`);
  const body = unwrap<AdminServiceOrderDetailDTO>(res.data);
  return body;
}

export type AdminWorkshopEarnings = {
  workshop_id: string;
  workshop_name: string;
  sales_count: number;
  total_revenue: number;
  paid_amount: number;
  pending_amount: number;
};

export type AdminOwnerEarnings = {
  owner_id: string;
  owner_name: string;
  total_sales: number;
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  workshops: AdminWorkshopEarnings[];
};

export type PeriodFilter = "month" | "3months" | "6months" | "year";

export async function adminGetEarnings(
  period: PeriodFilter = "month",
): Promise<AdminOwnerEarnings[]> {
  const res = await api.get("/admin/earnings", { params: { period } });
  const body = unwrap<{ owners: AdminOwnerEarnings[] }>(res.data);
  return body.owners;
}

// =====================
// Credit System
// =====================

export type MyCreditLine = {
  level: number;
  parts_limit: number;
  service_limit: number;
  parts_available: number;
  service_available: number;
  parts_debt: number;
  service_debt: number;
  min_down_payment_pct: number;
  credit_points: number;
  points_to_next_level: number | null;
  pending_points: number;
};

export type PendingRelease = {
  order_id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
};

export type CreditLineDetail = {
  line_type: string;
  limit: number;
  available: number;
  debt: number;
  pending_releases: PendingRelease[];
};

export type AdminCreditLine = {
  user_id: string;
  user_name: string;
  user_email: string;
  level: number;
  credit_points: number;
  points_to_next_level: number | null;
  parts_limit: number;
  service_limit: number;
  parts_available: number;
  service_available: number;
  parts_debt: number;
  service_debt: number;
  total_spent: number;
  parts_orders_count: number;
  parts_orders_paid_cash: number;
  parts_orders_financed: number;
  parts_installments_on_time: number;
  parts_installments_late: number;
  service_orders_count: number;
  service_orders_cash: number;
  service_orders_financed: number;
  service_installments_on_time: number;
  service_installments_late: number;
  manual_adjustment: number | null;
};

export type CheckoutEligibility = {
  eligible: boolean;
  parts_available: number;
  service_available: number;
  min_down_payment_percentage: number | null;
  message: string | null;
};

export async function getMyCreditLine(): Promise<MyCreditLine> {
  const res = await api.get("/credit/my-line");
  return unwrap<MyCreditLine>(res.data);
}

export async function getCreditLineDetail(
  lineType: "parts" | "service",
): Promise<CreditLineDetail> {
  const res = await api.get(`/credit/my-line/${lineType}`);
  return unwrap<CreditLineDetail>(res.data);
}

export async function checkCheckoutEligibility(
  totalFinancedParts: number,
  totalFinancedService: number = 0,
): Promise<CheckoutEligibility> {
  const res = await api.post("/credit/checkout-eligibility", {
    total_financed_parts: totalFinancedParts,
    total_financed_service: totalFinancedService,
  });
  return unwrap<CheckoutEligibility>(res.data);
}

export async function adminGetCreditLines(): Promise<AdminCreditLine[]> {
  const res = await api.get("/credit/admin/lines");
  const body = unwrap<{ lines: AdminCreditLine[] }>(res.data);
  return body.lines;
}

export async function adminGetCreditLine(
  userId: string,
): Promise<AdminCreditLine> {
  const res = await api.get(`/credit/admin/lines/${userId}`);
  return unwrap<AdminCreditLine>(res.data);
}

export async function adminUpdateCreditLine(
  userId: string,
  input: { parts_credit_limit?: number; service_credit_limit?: number },
): Promise<MyCreditLine> {
  const res = await api.put(`/credit/admin/lines/${userId}`, input);
  return unwrap<MyCreditLine>(res.data);
}

// Service financing
export type FinanceServiceOrderInput = {
  down_payment_pct: number;
  payment_method: string;
  reference_number?: string;
  rate?: number | null;
  rate_date?: string | null;
};

export async function financeServiceOrder(
  orderId: string,
  input: FinanceServiceOrderInput,
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/orders/${orderId}/finance`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export type PayServiceInstallmentInput = {
  payment_method: string;
  reference_number?: string;
  rate?: number | null;
  rate_date?: string | null;
  paid_at?: string | null;
};

export async function payServiceInstallment(
  installmentId: string,
  input: PayServiceInstallmentInput,
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/installments/${installmentId}/pay`, input);
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceInstallmentPaid(
  installmentId: string,
  input?: { paid_at?: string | null },
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/installments/${installmentId}/mark-paid`, input ?? {});
  return unwrap<ServiceOrderDTO>(res.data);
}

export async function markServiceInstallmentErroneous(
  installmentId: string,
): Promise<ServiceOrderDTO> {
  const res = await api.post(`/services/installments/${installmentId}/mark-erroneous`);
  return unwrap<ServiceOrderDTO>(res.data);
}

// --- Late Fees ---

export type LateFeeDTO = {
  id: string;
  installment_type: string;
  installment_id: string;
  amount: number;
  status: string;
  payment_method: string;
  reference_number: string | null;
  rate: number | null;
  rate_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export type LateFeeListDTO = {
  late_fees: LateFeeDTO[];
};

export type PayLateFeeInput = {
  payment_method: string;
  reference_number?: string;
  rate?: number | null;
  rate_date?: string | null;
};

export async function getMyLateFees(): Promise<LateFeeListDTO> {
  const res = await api.get(`/credit/my-late-fees`);
  return unwrap<LateFeeListDTO>(res.data);
}

export type PaymentDestination = {
  id: string;
  label: string;
  method_type: string;
  bank_name: string | null;
  account_number: string | null;
  holder_name: string | null;
  holder_ci: string | null;
  phone: string | null;
  email: string | null;
};

export async function getPaymentDestinations(): Promise<PaymentDestination[]> {
  const res = await api.get(`/credit/payment-destinations`);
  return unwrap<PaymentDestination[]>(res.data);
}

export async function payLateFee(
  lateFeeId: string,
  input: PayLateFeeInput,
): Promise<LateFeeDTO> {
  const res = await api.post(`/credit/late-fees/${lateFeeId}/pay`, input);
  return unwrap<LateFeeDTO>(res.data);
}

export async function markLateFeePaid(
  lateFeeId: string,
): Promise<LateFeeDTO> {
  const res = await api.post(`/credit/late-fees/${lateFeeId}/mark-paid`);
  return unwrap<LateFeeDTO>(res.data);
}

// --- Limit Review ---

export type LimitReview = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
};

export type AdminLimitReview = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  current_parts_limit: number;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_name: string | null;
};

export async function requestLimitReview(): Promise<void> {
  await api.post("/credit/request-limit-review");
}

export async function getMyLimitRequests(): Promise<LimitReview[]> {
  const res = await api.get("/credit/my-limit-requests");
  return unwrap<LimitReview[]>(res.data);
}

export async function adminGetLimitRequests(): Promise<AdminLimitReview[]> {
  const res = await api.get("/credit/admin/limit-requests");
  const body = unwrap<{ requests: AdminLimitReview[] }>(res.data);
  return body.requests;
}

export async function adminReviewLimitRequest(
  requestId: string,
  action: "APPROVED" | "REJECTED",
  newPartsLimit?: number,
): Promise<void> {
  await api.put(`/credit/admin/limit-requests/${requestId}`, {
    action,
    new_parts_limit: newPartsLimit,
  });
}

// --- Commissions ---

export type CommissionItem = {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type AdminCommission = {
  id: string;
  workshop_id: string;
  workshop_name: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  order_id: string | null;
  service_order_id: string | null;
  financed_amount: number;
  commission_rate: number;
  commission_amount: number;
  period_month: number;
  period_year: number;
  status: string;
  payment_method: string | null;
  reference_number: string | null;
  rate: number | null;
  rate_date: string | null;
  created_at: string;
  paid_at: string | null;
  items: CommissionItem[];
};

export type AdminCommissionList = {
  commissions: AdminCommission[];
  total_pending: number;
  total_paid: number;
};

export async function adminListCommissions(
  status?: string,
  workshopId?: string,
): Promise<AdminCommissionList> {
  const res = await api.get("/admin/commissions", {
    params: { status, workshop_id: workshopId },
  });
  return unwrap<AdminCommissionList>(res.data);
}

export async function adminMarkCommissionPaid(commissionId: string): Promise<void> {
  await api.patch(`/admin/commissions/${commissionId}/mark-paid`);
}

export type CutoffWorkshop = {
  workshop_id: string;
  workshop_name: string;
  commission_count: number;
  total_amount: number;
  pending_amount: number;
  paid_amount: number;
};

export type CutoffSummary = {
  period_month: number;
  period_year: number;
  workshops: CutoffWorkshop[];
  grand_total: number;
  grand_pending: number;
  grand_paid: number;
};

export async function adminGetCutoff(
  month?: number,
  year?: number,
): Promise<CutoffSummary> {
  const res = await api.get("/admin/commissions/cutoff", {
    params: { month, year },
  });
  return unwrap<CutoffSummary>(res.data);
}

// --- Late Fees (Superadmin) ---

export type AdminLateFee = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  installment_type: string;
  installment_id: string;
  amount: number;
  status: string;
  payment_method: string;
  reference_number: string | null;
  rate: number | null;
  rate_date: string | null;
  paid_at: string | null;
  erroneous_note: string | null;
  created_at: string;
};

export type AdminLateFeeList = {
  late_fees: AdminLateFee[];
  total_pending: number;
  total_paid: number;
};

export async function adminListLateFees(
  status?: string,
): Promise<AdminLateFeeList> {
  const res = await api.get("/admin/late-fees", { params: { status } });
  return unwrap<AdminLateFeeList>(res.data);
}

export async function adminMarkLateFeePaid(
  lateFeeId: string,
  paymentMethod: string,
  referenceNumber?: string,
): Promise<void> {
  await api.patch(`/admin/late-fees/${lateFeeId}/mark-paid`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
  });
}

export async function adminMarkLateFeeErroneous(
  lateFeeId: string,
): Promise<void> {
  await api.patch(`/admin/late-fees/${lateFeeId}/mark-erroneous`);
}

export async function adminVerifyLateFee(
  lateFeeId: string,
): Promise<void> {
  await api.patch(`/admin/late-fees/${lateFeeId}/verify`);
}

export async function adminRegisterCommissionPayment(
  commissionId: string,
  paymentMethod: string,
  referenceNumber?: string,
  rate?: number,
  rateDate?: string,
): Promise<void> {
  await api.patch(`/admin/commissions/${commissionId}/register-payment`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    rate,
    rate_date: rateDate,
  });
}

export async function adminMarkCommissionErroneous(
  commissionId: string,
): Promise<void> {
  await api.patch(`/admin/commissions/${commissionId}/mark-erroneous`);
}

export async function adminRegisterAllCommissionsPayment(
  workshopId: string,
  paymentMethod: string,
  referenceNumber?: string,
  rate?: number,
  rateDate?: string,
): Promise<void> {
  await api.patch(`/admin/commissions/workshop/${workshopId}/register-payment-all`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    rate,
    rate_date: rateDate,
  });
}

export async function adminMarkAllCommissionsPaid(
  workshopId: string,
): Promise<void> {
  await api.patch(`/admin/commissions/workshop/${workshopId}/mark-paid-all`);
}

export async function adminMarkAllCommissionsErroneous(
  workshopId: string,
): Promise<void> {
  await api.patch(`/admin/commissions/workshop/${workshopId}/mark-erroneous-all`);
}

// --- Admin Payment Methods ---

export type AdminPaymentMethod = {
  id: string;
  label: string;
  method_type: string;
  bank_name: string | null;
  account_number: string | null;
  holder_name: string | null;
  holder_ci: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

export type CreateAdminPaymentMethodInput = {
  label: string;
  method_type: string;
  bank_name?: string;
  account_number?: string;
  holder_name?: string;
  holder_ci?: string;
  phone?: string;
  email?: string;
};

export async function adminListPaymentMethods(): Promise<AdminPaymentMethod[]> {
  const res = await api.get("/admin/payment-methods");
  const body = unwrap<{ methods: AdminPaymentMethod[] }>(res.data);
  return body.methods;
}

export async function adminCreatePaymentMethod(
  input: CreateAdminPaymentMethodInput,
): Promise<AdminPaymentMethod> {
  const res = await api.post("/admin/payment-methods", input);
  return unwrap<AdminPaymentMethod>(res.data);
}

export async function adminTogglePaymentMethod(id: string): Promise<void> {
  await api.patch(`/admin/payment-methods/${id}/toggle`);
}

export async function adminDeletePaymentMethod(id: string): Promise<void> {
  await api.delete(`/admin/payment-methods/${id}`);
}

// --- Superadmin: Create User ---

export type SuperadminCreateUserInput = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  ci: string;
  phone: string;
  role: "CLIENT" | "WORKSHOP_OWNER" | "ADMIN";
  credit_level?: number;
  parts_credit_limit?: number;
  service_credit_limit?: number;
};

export async function adminCreateUser(
  input: SuperadminCreateUserInput,
): Promise<void> {
  await api.post("/admin/users", input);
}

// --- Workshop Owner Commissions ---

export type WorkshopCommission = {
  id: string;
  workshop_id: string;
  workshop_name: string;
  order_id: string | null;
  service_order_id: string | null;
  financed_amount: number;
  commission_rate: number;
  commission_amount: number;
  period_month: number;
  period_year: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export type MyCommissions = {
  commissions: WorkshopCommission[];
  total_pending: number;
  total_paid: number;
};

export async function getMyCommissions(): Promise<MyCommissions> {
  const res = await api.get("/workshops/my-commissions");
  return unwrap<MyCommissions>(res.data);
}

export async function registerMyCommissionPayment(
  commissionId: string,
  paymentMethod: string,
  referenceNumber?: string,
  rate?: number,
  rateDate?: string,
): Promise<void> {
  await api.patch(`/workshops/my-commissions/${commissionId}/register-payment`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    rate,
    rate_date: rateDate,
  });
}

export async function registerAllMyCommissionsPayment(
  workshopId: string,
  paymentMethod: string,
  referenceNumber?: string,
  rate?: number,
  rateDate?: string,
): Promise<void> {
  await api.patch(`/workshops/my-commissions/workshop/${workshopId}/register-payment-all`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    rate,
    rate_date: rateDate,
  });
}

export async function registerAllWorkshopsCommissionsPayment(
  paymentMethod: string,
  referenceNumber?: string,
  rate?: number,
  rateDate?: string,
): Promise<void> {
  await api.patch(`/workshops/my-commissions/register-payment-all`, {
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    rate,
    rate_date: rateDate,
  });
}
