
import { z } from "zod";

export type FormMode = "login" | "register" | "reset";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  age: z.string().refine((val) => !isNaN(Number(val)), { message: "Age must be a number" })
    .refine((val) => Number(val) > 0, { message: "Age must be greater than 0" })
    .optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetFormValues = z.infer<typeof resetSchema>;
