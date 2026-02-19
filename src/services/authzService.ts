import { mockUsers, type User } from '../data/pipeline';

type Role = User['role'];

export const authzService = {
  getUser(userId: string): User | undefined {
    return mockUsers.find((user) => user.id === userId);
  },

  requireRole(userId: string, allowedRoles: Role[]): User {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`User ${user.name} is not authorized for this action.`);
    }
    return user;
  },

  canApproveContract(userId: string): boolean {
    const user = this.getUser(userId);
    if (!user) return false;
    return ['Owner', 'Finance'].includes(user.role);
  },

  canSyncInvoice(userId: string): boolean {
    const user = this.getUser(userId);
    if (!user) return false;
    return ['Finance', 'Owner'].includes(user.role);
  },

  assertCanSyncInvoice(userId: string) {
    if (!this.canSyncInvoice(userId)) {
      throw new Error('Only Finance or Owner can sync invoices to external systems.');
    }
  },
};
