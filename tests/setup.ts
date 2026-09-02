import { vi, beforeEach } from "vitest";
import { mockPrisma, prismaTestUtils } from "./mocks/prisma.mock";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

beforeEach(() => {
  prismaTestUtils.resetMockDb();
  vi.clearAllMocks();
});
