import { Role } from './role.enum';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  desa?: string;
  rw?: string;
  rt?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}
