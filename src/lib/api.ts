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
  return body.workshops ?? body;
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
  const res = await api.get("/orders");
  const body = unwrap<Order[] | { orders: Order[] }>(res.data);
  if (Array.isArray(body)) return body;
  return body.orders ?? body;
}