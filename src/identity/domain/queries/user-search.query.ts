import { Role } from 'src/common/auth';

export interface UserSearchQuery {
  searchTerm?: string;
  role?: Role;
  status?: 'active' | 'inactive';
  createdAtGte?: Date;
  createdAtLte?: Date;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}
