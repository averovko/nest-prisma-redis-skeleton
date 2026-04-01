export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}
