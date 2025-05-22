
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-white border-t py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo className="mb-4" />
            <p className="text-sm text-gray-600">
              Empowering young minds with coding skills for the future.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-gray-600 hover:text-academy-orange">
                  Home
                </a>
              </li>
              <li>
                <a href="/about" className="text-sm text-gray-600 hover:text-academy-orange">
                  About Us
                </a>
              </li>
              <li>
                <a href="/courses" className="text-sm text-gray-600 hover:text-academy-orange">
                  Courses
                </a>
              </li>
              <li>
                <a href="/contact" className="text-sm text-gray-600 hover:text-academy-orange">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Contact Us
            </h3>
            <address className="not-italic text-sm text-gray-600 space-y-2">
              <p>123 Coding Street</p>
              <p>San Francisco, CA 94103</p>
              <p>Email: info@upsjunior.code</p>
              <p>Phone: (123) 456-7890</p>
            </address>
          </div>
        </div>
        <div className="mt-8 border-t pt-8">
          <p className="text-sm text-center text-gray-500">
            &copy; {new Date().getFullYear()} UPS Junior Coding Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
