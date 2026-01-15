// 🔐 Interfaces de Autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  isActive: boolean;
  createdAt: string;
  avatar?: string; // 🖼️ URL del avatar (opcional)
}

export enum UserRole {
  Admin = 'Admin',
  Technician = 'Technician', 
  User = 'User'
}

// 📊 Response wrapper para APIs
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// 📄 Interfaces para paginación
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
