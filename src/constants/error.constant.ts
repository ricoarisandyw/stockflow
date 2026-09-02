import type { THttpErrorCode } from "@/constants/http-status.constant";

export type TApiErrorCode = THttpErrorCode;

export type TErrorDefinition = {
  readonly codeNumber: number;
  readonly code: TApiErrorCode;
  readonly message: string;
};

export const ErrorConstant = {
  // ==========================================
  // 1000 - 1999: AUTH & USER DOMAIN
  // ==========================================
  AUTH_INVALID_CREDENTIALS: {
    codeNumber: 1001,
    code: "UNAUTHORIZED",
    message: "Invalid email or password.",
  },
  AUTH_UNAUTHORIZED: {
    codeNumber: 1002,
    code: "UNAUTHORIZED",
    message: "Authentication token is missing or invalid.",
  },
  AUTH_FORBIDDEN: {
    codeNumber: 1003,
    code: "FORBIDDEN",
    message: "You do not have permission to access this resource.",
  },
  AUTH_EMAIL_EXISTS: {
    codeNumber: 1004,
    code: "CONFLICT",
    message: "Email is already registered.",
  },
  USER_NOT_FOUND: {
    codeNumber: 1005,
    code: "NOT_FOUND",
    message: "User not found.",
  },

  // ==========================================
  // 2000 - 2999: PRODUCT DOMAIN
  // ==========================================
  PRODUCT_NOT_FOUND: {
    codeNumber: 2001,
    code: "NOT_FOUND",
    message: "Product not found.",
  },
  PRODUCT_SKU_EXISTS: {
    codeNumber: 2002,
    code: "CONFLICT",
    message: "SKU is already in use.",
  },
  PRODUCT_HAS_INVOICE_ITEMS: {
    codeNumber: 2003,
    code: "CONFLICT",
    message: "Product cannot be deleted because it is referenced by an invoice.",
  },

  // ==========================================
  // 9000 - 9999: GENERAL & SYSTEM DOMAIN
  // ==========================================
  INVALID_PAYLOAD: {
    codeNumber: 9001,
    code: "BAD_REQUEST",
    message: "Invalid request payload.",
  },
  INTERNAL_SERVER_ERROR: {
    codeNumber: 9999,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred.",
  },
} as const satisfies Record<string, TErrorDefinition>;
