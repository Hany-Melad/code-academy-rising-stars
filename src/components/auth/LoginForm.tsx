
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { loginSchema, LoginFormValues, FormMode } from "./types";

interface LoginFormProps {
  onModeChange: (mode: FormMode) => void;
}

export function LoginForm({ onModeChange }: LoginFormProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
        <p className="text-sm text-gray-600 mt-2">Sign in to your account</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
          onClick={() => onModeChange("reset")}
          className="text-academy-blue hover:underline"
        >
          Forgot password?
        </button>
      </div>
      
      <div className="mt-2 text-center text-sm">
        <span className="text-gray-600">Don't have an account?</span>{" "}
        <button
          type="button"
          onClick={() => onModeChange("register")}
          className="text-academy-blue hover:underline font-medium"
        >
          Sign up
        </button>
      </div>
    </>
  );
}
