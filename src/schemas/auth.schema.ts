import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});


export const authUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.date().optional(),
});

export const authSuccessResponseSchema = z.object({
  user: authUserResponseSchema,
  token: z.string(),
});

export type TRegisterInput = z.infer<typeof registerSchema>;
export type TLoginInput = z.infer<typeof loginSchema>;
export type TAuthUserResponse = z.infer<typeof authUserResponseSchema>;
export type TAuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;

export const authSchema = {
  register: registerSchema,
  login: loginSchema,
  userResponse: authUserResponseSchema,
  successResponse: authSuccessResponseSchema,
};

