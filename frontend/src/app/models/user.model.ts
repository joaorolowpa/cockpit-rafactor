export enum UserRole {
  ADMIN = 'ADMIN',
  STANDARD = 'STANDARD',
  PORTFOLIO = 'PORTFOLIO',
  WPA = 'WPA',
  BACKOFFICE = 'BACKOFFICE',
  RESEARCH_EQUITIES = 'RESEARCH_EQUITIES',
  RESEARCH_FUNDS = 'RESEARCH_FUNDS',
  ACCOUNTING = 'ACCOUNTING',
  DEVELOPER = 'DEVELOPER'
}

export interface User {
  id: number;
  email: string;
  name: string;
  user_active: boolean;
  roles: UserRole[];
}

export interface CreateUserDto {
  email: string;
  name: string;
  user_active: boolean;
  roles: UserRole[];
}

export interface UpdateUserDto {
  email: string;
  name: string;
  user_active: boolean;
  roles: UserRole[];
}