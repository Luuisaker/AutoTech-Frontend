import { api } from "./axios";

// ── Core wrapper ────────────────────────────────────

export type CoreResponse<T> = {
  success: boolean;
  status_code: number;
  message: string;
  content: T;
};

function unwrap<T>(data: T | CoreResponse<T>): T {
  return typeof data === "object" && data != null && "content" in (data as CoreResponse<T>)
    ? (data as CoreResponse<T>).content
    : (data as T);
}

// ── Workshops ──────────────────────────────────────

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

export async function getWorkshops(): Promise<Workshop[]> {
  const res = await api.get<Workshop[] | CoreResponse<Workshop[]>>("/workshops");
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body;
}

export async function getMyWorkshops(): Promise<Workshop[]> {
  const res = await api.get<Workshop[] | CoreResponse<Workshop[]>>("/workshops", {
    params: { owned: true },
  });
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body;
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

  const res = await api.post<Workshop | CoreResponse<Workshop>>("/workshops", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrap(res.data);
}

export async function getPendingVerifications(): Promise<Workshop[]> {
  const res = await api.get<Workshop[] | CoreResponse<Workshop[]>>(
    "/workshops/verifications/pending",
  );
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body;
}

export async function certifyWorkshop(id: string): Promise<Workshop> {
  const res = await api.post<Workshop | CoreResponse<Workshop>>(`/workshops/${id}/certify`);
  return unwrap(res.data);
}

// ── Vehicles ────────────────────────────────────────

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
  const res = await api.get<string[] | CoreResponse<{ types: string[] }>>("/vehicles/types");
  const body = unwrap(res.data);
  if (Array.isArray(body)) return body as VehicleType[];
  return (body as { types: VehicleType[] }).types;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get<Vehicle[] | CoreResponse<VehicleListContent>>("/vehicles");
  const body = unwrap(res.data);
  if (Array.isArray(body)) return body;
  return (body as VehicleListContent).vehicles;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const res = await api.post<Vehicle | CoreResponse<Vehicle>>("/vehicles", input);
  return unwrap(res.data);
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const res = await api.get<Vehicle | CoreResponse<Vehicle>>(`/vehicles/${id}`);
  return unwrap(res.data);
}

export async function updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
  const res = await api.put<Vehicle | CoreResponse<Vehicle>>(`/vehicles/${id}`, input);
  return unwrap(res.data);
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete<void | CoreResponse<null>>(`/vehicles/${id}`);
}

// ── Orders (placeholder) ────────────────────────────

export type OrderStatus = "PENDING" | "PAID" | "FINANCED" | "COMPLETED" | "CANCELLED";

export type Order = {
  id: string;
  user_id: string;
  workshop_id: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

export async function getOrders(): Promise<Order[]> {
  const res = await api.get<Order[] | CoreResponse<Order[]>>("/orders");
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body;
}
