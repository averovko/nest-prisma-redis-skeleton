import { UserActivityType } from './user-activity-type.enum';

export { UserActivityType };

export class UserActivity {
  id: string;
  authId: string;
  activityType: UserActivityType;
  performedBy: string | null;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  success: boolean;
  location: string | null;
  device: string | null;
  client: string | null;
  os: string | null;

  constructor(partial: Partial<UserActivity>) {
    Object.assign(this, partial);
    this.timestamp = this.timestamp || new Date();
    this.details = this.details || {};
    this.metadata = this.metadata || {};
    this.success = this.success ?? true;
    this.location = this.location ?? null;
  }
}
