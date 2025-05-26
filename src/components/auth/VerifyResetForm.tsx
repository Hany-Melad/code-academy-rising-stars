
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";

const verifyResetSchema = z.object({
  code: z.string().length(6, { message: "Verification code must be 6 digits" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type VerifyResetFormValues = z.infer<typeof verifyResetSchema>;

export function VerifyResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const form = useForm<VerifyResetFormValues>({
    resolver: zodResolver(verifyResetSchema),
    defaultValues: {
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleVerifyAndReset = async (data: VerifyResetFormValues) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found. Please start the reset process again.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      // Verify the OTP and update password
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.code,
        type: 'recovery'
      });

      if (error) {
        throw error;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password.",
      });

      // Sign out to ensure clean state and redirect to login
      await supabase.auth.signOut();
      navigate("/auth");

    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid verification code or error updating password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend code",
        variant: "destructive",
      });
    }
  };

  if (!email) {
    return (
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h2>
        <p className="text-gray-600 mb-6">Please start the password reset process from the beginning.</p>
        <Button onClick={() => navigate("/auth")} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Verify & Reset Password</h2>
        <p className="text-sm text-gray-600 mt-2">
          Enter the verification code sent to <strong>{email}</strong> and your new password
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleVerifyAndReset)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
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
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm new password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Form>
      
      <div className="mt-6 text-center space-y-2">
        <button
          type="button"
          onClick={handleResendCode}
          className="text-academy-blue hover:underline text-sm"
        >
          Didn't receive the code? Resend
        </button>
        <div>
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-gray-600 hover:underline text-sm"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
