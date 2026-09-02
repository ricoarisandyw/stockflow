"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { loginSchema, type TLoginInput } from "@/schemas/auth.schema";
import type { components } from "@/generated/api/schema";

const DEMO_CREDENTIALS: TLoginInput = { email: "staff@stockflow.dev", password: "Password123!" };

type TLoginError = components["schemas"]["StandardErrorResponse"];

export function FormLogin() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TLoginInput>({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation<unknown, TLoginError, TLoginInput>({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await apiClient.POST("/auth/login", {
        body: { email, password },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      router.push("/products");
      router.refresh();
    },
    onError: (error) => {
      const details = error.error?.details;
      details?.forEach((d) => {
        if (d.field && d.message) setError(d.field as keyof TLoginInput, { message: d.message });
      });
      const message =
        error.error?.code === "UNAUTHORIZED"
          ? "Incorrect email or password."
          : (error.error?.message ?? "Something went wrong. Please try again.");
      setError("root", { message });
    },
  });

  function fillDemoCredentials() {
    setValue("email", DEMO_CREDENTIALS.email);
    setValue("password", DEMO_CREDENTIALS.password);
  }

  function onSubmit(values: TLoginInput) {
    loginMutation.mutate(values);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Log in</h2>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-xs font-medium text-gray-500 underline hover:text-gray-900"
        >
          Use demo credentials
        </button>
      </div>

      {errors.root?.message && (
        <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          {...register("email")}
        />
        {errors.email?.message && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          {...register("password")}
        />
        {errors.password?.message && (
          <p id="password-error" className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loginMutation.isPending ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-gray-900 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
