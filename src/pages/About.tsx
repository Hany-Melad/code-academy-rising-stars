import React from 'react';
import { MainLayout } from "@/components/MainLayout";

const About = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-academy-blue mb-4">About the Trainer & Our Academy</h1>
          <p className="text-lg text-gray-600">
            Inspiring the next generation of tech innovators! 💡🚀
          </p>
        </div>

        {/* Instructor Section */}
        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center">
          <img 
            src="https://i.postimg.cc/VvQ22vqs/IMG-20250123-WA0069.jpg" 
            alt="Instructor" 
            className="w-40 h-40 rounded-full object-cover shadow-md"
          />
          <div className="text-gray-700">
            <p>
              Our lead instructor is a Teaching Assistant at the Faculty of Engineering with a Master’s in Artificial Intelligence and hands-on experience in embedded systems and autonomous vehicles.
            </p>
            <p className="mt-2">
              With a passion for education and innovation, he brings real-world technology into the classroom in a fun and simple way.
            </p>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-academy-orange mb-4">Our Amazing Students</h2>
          <p className="text-gray-700 mb-4">
            Our students are the stars of the academy! From building robots to presenting at national competitions, they continue to impress us every day.
          </p>
          <img 
            src="https://i.postimg.cc/T347ZhG8/FB-IMG-1735299121827.jpg" 
            alt="Students participating in competitions" 
            className="rounded-lg shadow-md w-full object-cover"
          />
        </div>

        {/* Video Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-academy-orange mb-4">Watch Us in Action!</h2>
          <div className="aspect-w-16 aspect-h-9 w-full">
            <iframe 
              src="https://www.youtube.com/embed/8S4ius-ZafM" 
              title="Junior Coding Academy Highlights"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-64 md:h-96 rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
