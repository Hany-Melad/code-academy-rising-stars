import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase"; // assuming shared client
import type { Tables } from "@/integrations/supabase/types"; // Assuming Tables type from generated types

// Define types for clarity, ensuring they match your generated types
type CertificateTableInsert = Tables<'certificates'>;
type StudentCertificateTableInsert = Tables<'student_certificates'>;


export default function CertificatesPage() {
  // Existing states
  const [studentName, setStudentName] = useState("");
  const [studentUniqueId, setStudentUniqueId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // States for certificate design data, pre-filled with defaults
  const [primaryColor, setPrimaryColor] = useState("#F7941D"); // Default orange
  const [secondaryColor, setSecondaryColor] = useState("#004B8D"); // Default deep blue
  const [backgroundColor, setBackgroundColor] = useState("#e6f7fb"); // Default light blue

  const [headerImageUrl, setHeaderImageUrl] = useState("https://i.postimg.cc/3xb1pWP1/icone-html-orange.png");
  const [logoImageUrl, setLogoImageUrl] = useState("https://i.postimg.cc/G2nz8KtS/logo-2.png");
  const [ribbonImageUrl, setRibbonImageUrl] = useState("https://i.postimg.cc/QtZpk7SQ/gold-badge-png-11552734724wixvd59trm.png");
  const [footerImageUrl, setFooterImageUrl] = useState("https://i.postimg.cc/0NT61qwP/signature.png"); // Assuming footer_image_url is for signature

  const handleGenerate = async () => {
    // Input validation (basic example)
    if (!studentName || !studentUniqueId || !courseName || !description || !startDate || !endDate) {
      alert("Please fill in all required student and course details.");
      return;
    }

    const certificateId = uuidv4();
    const certificateText = `For completing ${courseName} Course with focus on ${description}, from ${startDate} until ${endDate}`;
    const certificateDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    const certToInsert: CertificateTableInsert = {
      id: certificateId,
      course_name: courseName,
      certificate_text: certificateText,
      certificate_date: certificateDate,
      is_visible: true,
      created_at: new Date().toISOString(), // Assuming your DB default might not be sufficient or you want explicit control

      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_color: backgroundColor,
      header_image_url: headerImageUrl,
      logo_image_url: logoImageUrl,
      ribbon_image_url: ribbonImageUrl,
      footer_image_url: footerImageUrl,
    };

    const studentCertToInsert: StudentCertificateTableInsert = {
      id: uuidv4(), // Assuming your Insert type requires this explicitly despite DB default
      certificate_id: certificateId,
      student_unique_id: studentUniqueId,
      student_name: studentName,
      download_count: 0,
      created_at: new Date().toISOString(), // Assuming your Insert type requires this explicitly despite DB default
    };

    const { error: certError } = await supabase
      .from("certificates")
      .insert(certToInsert);

    if (certError) {
      console.error("Certificate creation failed:", certError);
      alert(`Error creating certificate: ${certError.message}`);
      return;
    }

    const { error: studentCertError } = await supabase
      .from("student_certificates")
      .insert(studentCertToInsert);

    if (studentCertError) {
      console.error("Student certificate assignment failed:", studentCertError);
      alert(`Error assigning certificate to student: ${studentCertError.message}`);
    } else {
      alert("✅ Certificate successfully created and assigned!");
      // --- KEY CHANGE: ALL fields are now RETAINED after submission ---
      // No clearing of any state variables here.
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Create & Assign Certificate
        </h2>

        <h3 className="text-xl font-semibold mb-4 text-gray-800">Student & Course Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Student Unique ID (from Profiles table)"
            value={studentUniqueId}
            onChange={(e) => setStudentUniqueId(e.target.value)}
            className="p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Course Name (e.g., HTML Basics)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <textarea
            placeholder="Course Description (e.g., Basic concepts, List, Media, Form, and Table)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded sm:col-span-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            required
          />
          <label className="block">
            <span className="text-gray-700 text-sm">Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </label>
        </div>

        <h3 className="text-xl font-semibold mb-4 text-gray-800">Certificate Design Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <label className="block">
            <span className="text-gray-700 text-sm">Primary Color (Hex Code):</span>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-orange-500 focus:border-orange-500"
              placeholder="#F7941D"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">Secondary Color (Hex Code):</span>
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-blue-800 focus:border-blue-800"
              placeholder="#004B8D"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">Background Color (Hex Code):</span>
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-blue-200 focus:border-blue-200"
              placeholder="#e6f7fb"
            />
          </label>
        </div>

        <h3 className="text-xl font-semibold mb-4 text-gray-800">Image URLs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <label className="block">
            <span className="text-gray-700 text-sm">Header Image URL (e.g., HTML5 badge):</span>
            <input
              type="text"
              value={headerImageUrl}
              onChange={(e) => setHeaderImageUrl(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-gray-400 focus:border-gray-400"
              placeholder="https://example.com/badge.png"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">Logo Image URL (main logo):</span>
            <input
              type="text"
              value={logoImageUrl}
              onChange={(e) => setLogoImageUrl(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-gray-400 focus:border-gray-400"
              placeholder="https://example.com/logo.png"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">Ribbon Image URL:</span>
            <input
              type="text"
              value={ribbonImageUrl}
              onChange={(e) => setRibbonImageUrl(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-gray-400 focus:border-gray-400"
              placeholder="https://example.com/ribbon.png"
            />
          </label>
          <label className="block">
            <span className="text-gray-700 text-sm">Signature/Footer Image URL:</span>
            <input
              type="text"
              value={footerImageUrl}
              onChange={(e) => setFooterImageUrl(e.target.value)}
              className="mt-1 p-2 border rounded w-full focus:ring-gray-400 focus:border-gray-400"
              placeholder="https://example.com/signature.png"
            />
          </label>
        </div>

        <button
          onClick={handleGenerate}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition duration-200"
        >
          Generate & Assign Certificate
        </button>
      </div>
    </div>
  );
}