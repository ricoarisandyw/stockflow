import { vi } from "vitest";

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

let users: MockUser[] = [];
let nextId = 1;

function reset() {
  users = [];
  nextId = 1;
}

function seedUser(partial: Partial<MockUser> & { email: string; passwordHash: string }): MockUser {
  const user: MockUser = {
    id: partial.id ?? `usr_${nextId++}`,
    email: partial.email,
    passwordHash: partial.passwordHash,
    name: partial.name ?? null,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
  users.push(user);
  return user;
}

export const userModel = {
  findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
    if (where.email) return users.find((u) => u.email === where.email) ?? null;
    if (where.id) return users.find((u) => u.id === where.id) ?? null;
    return null;
  }),
  create: vi.fn(
    async ({
      data,
    }: {
      data: { email: string; passwordHash: string; name?: string };
    }) => seedUser(data)
  ),
};

export const userTestUtils = {
  reset,
  seedUser,
  getUsers: () => users,
};
