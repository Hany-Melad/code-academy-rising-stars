
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FormMode } from "./types";
import { SignedInUser } from "./SignedInUser";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

interface AuthFormProps {
  defaultMode?: FormMode;
}

export function AuthForm({ defaultMode = "login" }: AuthFormProps) {
  const [formMode, setFormMode] = useState<FormMode>(defaultMode);
  const { user } = useAuth();

  // If user is already logged in, show logout option
  if (user) {
    return <SignedInUser />;
  }

  return (
    <div className="w-full max-w-md">
      {formMode === "login" && <LoginForm onModeChange={setFormMode} />}
      {formMode === "register" && <RegisterForm onModeChange={setFormMode} />}
      {formMode === "reset" && <ResetPasswordForm onModeChange={setFormMode} />}
    </div>
  );
}
