import { ApiProperty } from '@nestjs/swagger';
import { BulkOperationResult } from '../../application/dto/bulk-operation.result';

export class BulkOperationResultDto {
  @ApiProperty()
  successCount: number;

  @ApiProperty()
  failureCount: number;

  @ApiProperty()
  errors: Array<{
    userId: string;
    error: string;
  }>;

  static fromResult(result: BulkOperationResult): BulkOperationResultDto {
    const dto = new BulkOperationResultDto();
    dto.successCount = result.successCount;
    dto.failureCount = result.failureCount;
    dto.errors = result.errors;
    return dto;
  }
}
