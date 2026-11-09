export const PackageType = {
  Verification: 0,
  Advertisement: 1,
} as const;
export type PackageType = (typeof PackageType)[keyof typeof PackageType];

export const TargetRole = {
  Student: 0,
  Company: 1,
} as const;
export type TargetRole = (typeof TargetRole)[keyof typeof TargetRole];

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  [PackageType.Verification]: 'Thẩm định dự án',
  [PackageType.Advertisement]: 'Quảng cáo',
};

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  [TargetRole.Student]: 'Sinh viên',
  [TargetRole.Company]: 'Doanh nghiệp',
};

export interface PackageResponse {
  id: string;
  code: string;
  name: string;
  type: PackageType;
  role: TargetRole;
  price: number;
  durationInDays: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackagesResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  packages: PackageResponse[];
}

export interface SavePackageRequest {
  code: string;
  name: string;
  type: number;
  role: number;
  price: number;
  durationInDays: number | null;
  isActive: boolean;
}

export interface PackageFilter {
  type?: number;
  role?: number;
  isActive?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
