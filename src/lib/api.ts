import { api } from "./axios";

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

export type WorkshopInput = {
  name: string;
  rif: string;
  address: string;
  latitude?: number;
  longitude?: number;
  verification_document?: File;
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
  average_rating: number;
  verification_document_url: string | null;
  created_at: string;
};

type WorkshopListContent = {
  workshops: Workshop[];
};

export async function getWorkshops(): Promise<Workshop[]> {
  const res = await api.get("/workshops", {
    params: {
      certified_only: true,
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

  const res = await api.post("/workshops", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrap<Workshop>(res.data);
}

export async function getPendingVerifications(): Promise<Workshop[]> {
  const res = await api.get("/workshops/verifications/pending");
  const body = unwrap<Workshop[] | WorkshopListContent>(res.data);
  if (Array.isArray(body)) return body;
  return body.workshops ?? [];
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
  vin: string;
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
  vin: string;
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
  const body = unwrap<Vehicle[] | VehicleListContent>(res.data);
  if (Array.isArray(body)) return body;
  return body.vehicles;
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

export type OrderDTO = {
  id: string;
  vehicle_id: string;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  installment_count: number;
  status: string;
  items: OrderItemDTO[];
  created_at: string;
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
  name: string;
  description: string | null;
  price: number;
  stock: number;
  condition: string;
  category: string | null;
  allows_installments: 0 | 1;
  installment_min_percentage: number;
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

export type CartItemDTO = {
  id: string;
  part_id: string;
  part_name: string;
  part_price: number;
  workshop_id: string;
  workshop_name: string;
  quantity: number;
  subtotal: number;
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

export async function removeCartItem(itemId: string): Promise<void> {
  await api.delete(`/cart/items/${itemId}`);
}

export async function clearCart(): Promise<void> {
  await api.delete("/cart");
}

export type CheckoutInput = {
  vehicle_id: string;
  mileage: number;
  installment_count: number;
};

export async function checkout(input: CheckoutInput): Promise<OrderDTO> {
  const res = await api.post("/orders/checkout", input);
  return unwrap<OrderDTO>(res.data);
}

export async function getOrderInstallments(orderId: string): Promise<InstallmentDTO[]> {
  const res = await api.get(`/orders/${orderId}/installments`);
  const body = unwrap<{ installments: InstallmentDTO[] }>(res.data);
  return body.installments;
}

export type PayInstallmentInput = {
  payment_method: string;
  reference_number?: string | null;
};

export async function payInstallment(
  installmentId: string,
  input: PayInstallmentInput,
): Promise<InstallmentDTO> {
  const res = await api.post(`/orders/installments/${installmentId}/pay`, input);
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
): Promise<OrderDTO[]> {
  const res = await api.get(`/parts/workshop/${workshopId}/sales`, { params });
  const body = unwrap<{ purchases: OrderDTO[] }>(res.data);
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

// ===== Services =====

export type ServiceDTO = {
  id: string;
  workshop_id: string;
  service_name: string;
  standard_price_min: number;
  standard_price_max: number;
  created_at: string;
};

export type CreateServiceInput = {
  workshop_id: string;
  service_name: string;
  standard_price_min: number;
  standard_price_max: number;
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
  standard_price_min?: number;
  standard_price_max?: number;
};

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceDTO> {
  const res = await api.put(`/services/${id}`, input);
  return unwrap<ServiceDTO>(res.data);
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
