
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";
    return isAdmin ? "/admin" : "/dashboard";
  };

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Logo />
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-academy-orange transition">
              Home
            </Link>
            <Link to="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-academy-orange transition">
              About
            </Link>
            <Link to="/courses" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-academy-orange transition">
              Courses
            </Link>
            
            {user ? (
              <Button asChild className="bg-academy-orange hover:bg-orange-600">
                <Link to={getDashboardLink()}>
                  {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="text-academy-blue border-academy-blue hover:bg-academy-lightBlue">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              About
            </Link>
            <Link
              to="/courses"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
              onClick={toggleMenu}
            >
              Courses
            </Link>
            {user ? (
              <Link
                to={getDashboardLink()}
                className="block px-3 py-2 text-base font-medium text-academy-blue hover:bg-gray-50"
                onClick={toggleMenu}
              >
                {isAdmin ? "Admin Dashboard" : "My Dashboard"}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="block px-3 py-2 text-base font-medium text-academy-blue hover:bg-gray-50"
                onClick={toggleMenu}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
