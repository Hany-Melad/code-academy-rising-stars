
import { MainLayout } from "@/components/MainLayout";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const AuthPage = () => {
  const { user, isLoading, isAdmin } = useAuth();
  
  console.log("AuthPage render - user:", user, "isLoading:", isLoading, "isAdmin:", isAdmin);
  
  if (isLoading) {
    return (
      <MainLayout hideFooter>
        <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50 items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (user) {
    console.log("User authenticated, redirecting to dashboard");
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return (
    <MainLayout hideFooter>
      <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <AuthForm />
        </div>
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-academy-orange to-academy-blue relative">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-white p-12">
            <h2 className="text-3xl font-bold mb-6">Welcome to UPS Junior Coding Academy</h2>
            <p className="text-lg max-w-md text-center mb-8">
              Start your coding journey today and learn skills that will shape your future.
            </p>
            <img 
              src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80" 
              alt="Coding laptop" 
              className="w-64 rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AuthPage;
