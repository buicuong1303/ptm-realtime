import { OnlineStatus } from '../utils/online-status';

export interface User {
  id: string;
  name: string;
  onlineStatus: OnlineStatus;
  lastActivity: Date;
}
