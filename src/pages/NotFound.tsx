
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/MainLayout";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-9xl font-extrabold text-academy-orange">404</h1>
          <p className="text-2xl font-semibold text-gray-900 mt-4 mb-6">
            Page not found
          </p>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <Button asChild size="lg" className="bg-academy-blue hover:bg-blue-600">
            <Link to="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
