import { UserActivityType } from '../../domain/entities/user-activity.entity';

export class CreateUserActivityInput {
  authId: string;
  activityType: UserActivityType;
  performedBy: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  location?: string;
  device?: string;
  client?: string;
  os?: string;
  metadata?: Record<string, any>;
}
