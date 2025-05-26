
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { resetSchema, ResetFormValues, FormMode } from "./types";
import { useNavigate } from "react-router-dom";

interface ResetPasswordFormProps {
  onModeChange: (mode: FormMode) => void;
}

export function ResetPasswordForm({ onModeChange }: ResetPasswordFormProps) {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleReset = async (data: ResetFormValues) => {
    const { error } = await resetPassword(data.email);
    if (!error) {
      // Route to verification page with email as state
      navigate("/auth/verify-reset", { state: { email: data.email } });
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-sm text-gray-600 mt-2">We'll send you a verification code to reset your password</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
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
          
          <div className="pt-2">
            <Button type="submit" className="w-full">
              Send Verification Code
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className="text-academy-blue hover:underline"
        >
          Back to login
        </button>
      </div>
    </>
  );
}
