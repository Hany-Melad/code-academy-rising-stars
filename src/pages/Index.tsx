
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Book, Home, Settings, Trophy, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isAdmin } = useAuth();
  
  const features = [
    {
      icon: Book,
      title: "Interactive Courses",
      description: "Learn coding through interactive lessons designed specifically for young students.",
    },
    {
      icon: Trophy,
      title: "Achievement System",
      description: "Earn points and badges as you progress through courses and complete challenges.",
    },
    {
      icon: User,
      title: "Expert Guidance",
      description: "Learn from expert instructors who are passionate about teaching coding to beginners.",
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-white to-academy-lightBlue">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-academy-orange">Learn to Code</span>
                <span className="block">Shape Your Future</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl">
                UPS Junior Coding Academy helps young students develop programming skills through interactive courses, fun projects, and a supportive learning environment.
              </p>
              <div className="mt-10 flex gap-4">
                <Button asChild size="lg" className="bg-academy-orange hover:bg-orange-600">
                  <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/auth"}>
                    {user ? "Go to Dashboard" : "Get Started"}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/courses">
                    Browse Courses
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-academy-blue to-academy-orange opacity-20 blur-2xl rounded-full transform translate-x-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1031&q=80" 
                alt="Coding" 
                className="relative rounded-lg shadow-xl object-cover w-full h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Choose UPS Junior Coding Academy?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform is designed to make learning coding fun, engaging, and accessible for young learners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-academy-lightBlue rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-academy-blue" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-academy-blue py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <h2 className="text-3xl font-bold text-gray-900">Ready to Start Your Coding Journey?</h2>
                <p className="mt-4 text-lg text-gray-600">
                  Join UPS Junior Coding Academy today and take the first step towards becoming a coding expert.
                </p>
                <div className="mt-8">
                  <Button asChild size="lg" className="bg-academy-orange hover:bg-orange-600">
                    <Link to="/auth" className="flex items-center gap-2">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block relative">
                <img 
                  src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Student learning to code" 
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
