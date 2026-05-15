import { User } from '../types';

export function canAccessResidentArea(user: User | null) {
  return user?.status === 'approved' || user?.status === 'admin';
}

export function isAdmin(user: User | null) {
  return user?.status === 'admin';
}
