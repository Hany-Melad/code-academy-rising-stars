import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type FormMode = "login" | "register" | "reset";

interface AuthFormProps {
  defaultMode?: FormMode;
}

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
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

const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export function AuthForm({ defaultMode = "login" }: AuthFormProps) {
  const [formMode, setFormMode] = useState<FormMode>(defaultMode);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: "",
      phone: "",
      location: "",
    },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    const { name, email, password, age, phone, location } = data;
    const userData = {
      name,
      age: age ? parseInt(age, 10) : undefined,
      phone,
      location,
      role: "student", // Default role for new users
    };
    
    const { error } = await signUp(email, password, userData);
    if (!error) {
      setFormMode("login");
    }
  };

  const handleReset = async (data: ResetFormValues) => {
    await resetPassword(data.email);
    setFormMode("login");
  };

  return (
    <div className="w-full max-w-md">
      {formMode === "login" && (
        <>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="text-sm text-gray-600 mt-2">Sign in to your account</p>
          </div>
          
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button type="submit" className="w-full bg-academy-orange hover:bg-orange-600">
                  Sign In
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setFormMode("reset")}
              className="text-academy-blue hover:underline"
            >
              Forgot password?
            </button>
          </div>
          
          <div className="mt-2 text-center text-sm">
            <span className="text-gray-600">Don't have an account?</span>{" "}
            <button
              type="button"
              onClick={() => setFormMode("register")}
              className="text-academy-blue hover:underline font-medium"
            >
              Sign up
            </button>
          </div>
        </>
      )}

      {formMode === "register" && (
        <>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Create an Account</h2>
            <p className="text-sm text-gray-600 mt-2">Join UPS Junior Coding Academy</p>
          </div>
          
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={registerForm.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter your age" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full bg-academy-blue hover:bg-blue-600">
                  Create Account
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account?</span>{" "}
            <button
              type="button"
              onClick={() => setFormMode("login")}
              className="text-academy-orange hover:underline font-medium"
            >
              Sign in
            </button>
          </div>
        </>
      )}

      {formMode === "reset" && (
        <>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-sm text-gray-600 mt-2">We'll send you a link to reset your password</p>
          </div>
          
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Send Reset Link
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setFormMode("login")}
              className="text-academy-blue hover:underline"
            >
              Back to login
            </button>
          </div>
        </>
      )}
    </div>
  );
}
