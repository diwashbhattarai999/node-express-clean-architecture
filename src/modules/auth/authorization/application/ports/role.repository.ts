export type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export interface IRoleRepository {
  listForUser(userId: string): Promise<Role[]>;
}
