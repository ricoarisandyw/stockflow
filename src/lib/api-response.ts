import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ErrorConstant,
  type TApiErrorCode,
  type TErrorDefinition,
} from "@/constants/error.constant";
import { HttpStatusConstant } from "@/constants/http-status.constant";

export type { TApiErrorCode, TErrorDefinition };

export type TMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type TErrorDetail = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  code: TApiErrorCode;
  codeNumber?: number;
  details?: TErrorDetail[];

  constructor(
    errorOrCode: TErrorDefinition | TApiErrorCode,
    customMessageOrDetails?: string | TErrorDetail[],
    details?: TErrorDetail[]
  ) {
    if (typeof errorOrCode === "object") {
      super(typeof customMessageOrDetails === "string" ? customMessageOrDetails : errorOrCode.message);
      this.code = errorOrCode.code;
      this.codeNumber = errorOrCode.codeNumber;
      this.details = Array.isArray(customMessageOrDetails) ? customMessageOrDetails : details;
    } else {
      super(typeof customMessageOrDetails === "string" ? customMessageOrDetails : "Error");
      this.code = errorOrCode;
      this.details = details;
    }
  }
}

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

function okPaginated<T>(data: T, meta: TMeta, status = 200) {
  return NextResponse.json({ success: true, data, meta }, { status });
}

function fail(
  errorOrCode: TErrorDefinition | TApiErrorCode,
  customMessageOrDetails?: string | TErrorDetail[],
  details?: TErrorDetail[]
) {
  let code: TApiErrorCode;
  let codeNumber: number | undefined;
  let message: string;
  let finalDetails: TErrorDetail[] | undefined;

  if (typeof errorOrCode === "object") {
    code = errorOrCode.code;
    codeNumber = errorOrCode.codeNumber;
    message = typeof customMessageOrDetails === "string" ? customMessageOrDetails : errorOrCode.message;
    finalDetails = Array.isArray(customMessageOrDetails) ? customMessageOrDetails : details;
  } else {
    code = errorOrCode;
    message = typeof customMessageOrDetails === "string" ? customMessageOrDetails : "Error";
    finalDetails = details;
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        ...(codeNumber !== undefined ? { codeNumber } : {}),
        message,
        ...(finalDetails ? { details: finalDetails } : {}),
      },
    },
    { status: HttpStatusConstant.getStatusCode(code) }
  );
}

function failZod(error: ZodError) {
  const details: TErrorDetail[] = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  return fail(ErrorConstant.INVALID_PAYLOAD, details);
}

function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return fail(
      { code: error.code, message: error.message, codeNumber: error.codeNumber ?? 9999 },
      error.message,
      error.details
    );
  }
  if (error instanceof ZodError) return failZod(error);
  console.error(error);
  return fail(ErrorConstant.INTERNAL_SERVER_ERROR);
}

export const ApiResponse = {
  ok,
  okPaginated,
  fail,
  failZod,
  handleApiError,
};
