
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Book, Trophy, User, Play } from "lucide-react";
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

  const sampleCourses = [
    {
      id: 1,
      title: "Introduction to Python",
      description: "Learn the basics of Python programming",
      thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400",
      duration: "2 hours",
      lessons: 12
    },
    {
      id: 2,
      title: "Web Development Basics",
      description: "HTML, CSS, and JavaScript fundamentals",
      thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400",
      duration: "3 hours",
      lessons: 18
    },
    {
      id: 3,
      title: "Game Development with Scratch",
      description: "Create fun games using visual programming",
      thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400",
      duration: "1.5 hours",
      lessons: 8
    }
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
                UPS Junior Coding Academy helps young students develop programming skills through interactive video courses, fun projects, and a supportive learning environment.
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
                src="https://i.postimg.cc/VNy5F8Dk/ezgif-com-animated-gif-maker-7.gif"
                alt="Coding" 
                className="relative rounded-lg shadow-xl object-cover w-full h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Featured Video Courses</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our most popular video courses designed to make learning programming fun and engaging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {course.duration}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{course.lessons} lessons</span>
                    <Button size="sm" variant="outline">
                      Watch Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="mt-8" >
                  <Button asChild size="lg" className="bg-academy-orange hover:bg-orange-600">
                    <Link to="/auth" className="flex items-center gap-2">
                      Go to courses <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-8">
                  <Button asChild size="lg" className="bg-academy-blue hover:bg-blue-600">
                    <Link to="https://ups-junior.github.io/Site/" className="flex items-center gap-2">
                      Learn More <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
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
