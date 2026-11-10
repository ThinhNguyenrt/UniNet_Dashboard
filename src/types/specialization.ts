export interface Specialization {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface SaveSpecializationRequest {
  code: string;
  name: string;
  isActive: boolean;
}

