import { IsOptional, IsDate, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PageOptionsDto } from 'src/common';
import { ActivitySearchQuery } from '../../domain/queries/activity-search.query';

export class ActivityFiltersDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityType?: string;

  toQuery(): ActivitySearchQuery {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      activityType: this.activityType,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
    };
  }
}
