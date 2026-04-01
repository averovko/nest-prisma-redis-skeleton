import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import dayjs from 'dayjs';
import { PageOptionsDto, OrderDirection } from 'src/common';

import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/common/auth';
import { UserSearchQuery } from '../../domain/queries/user-search.query';

const orderByOptions: (keyof User | 'name')[] = [
  'id',
  'name',
  'email',
  'phone',
  'createdAt',
  'updatedAt',
];

export class UserSearchFiltersDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search by user name, email, or phone number',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({
    enum: Object.values(Role),
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Transform((param) => dayjs(param.value).toDate())
  createdAtGte?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Transform((param) => dayjs(param.value).toDate())
  createdAtLte?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(orderByOptions)
  orderBy?: keyof User | 'name';

  @ApiPropertyOptional({
    enum: Object.values(OrderDirection),
    default: 'asc',
  })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection = OrderDirection.ASC;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform((param) => parseInt(param.value, 10))
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform((param) => parseInt(param.value, 10))
  limit?: number;

  toQuery(): UserSearchQuery {
    return {
      searchTerm: this.searchTerm,
      role: this.role,
      status: this.status,
      createdAtGte: this.createdAtGte,
      createdAtLte: this.createdAtLte,
      orderBy: this.orderBy,
      orderDirection: this.orderDirection,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
    };
  }
}
