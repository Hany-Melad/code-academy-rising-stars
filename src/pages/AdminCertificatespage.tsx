import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase"; // assuming shared client
import type { Tables } from "@/integrations/supabase/types";

type Certificate = Tables<"certificates">;
type StudentCertificate = Tables<"student_certificates">;



export default function CertificatesPage() {
  const [studentName, setStudentName] = useState("");
  const [studentUniqueId, setStudentUniqueId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerate = async () => {
    const certificateId = uuidv4();
    const certificateText = `For completing ${courseName} Course with focus on ${description}, from ${startDate} until ${endDate}`;
    const certificateDate = new Date().toISOString().split("T")[0];

    const certToInsert: Certificate = {
      id: certificateId,
      course_name: courseName,
      certificate_text: certificateText,
      certificate_date: certificateDate,
      is_visible: true,
      created_at: new Date().toISOString(), // Add if required in your schema
    };

    const studentCertToInsert: StudentCertificate = {
      certificate_id: certificateId,
      student_unique_id: studentUniqueId,
      student_name: studentName,
      download_count: 0, // Assuming initial count is 0
      id: uuidv4(), // Generate a unique ID for the student certificate link

      created_at: new Date().toISOString(), // Add if required


    };

    const { error: certError } = await supabase
      .from("certificates")
      .insert(certToInsert);

    if (certError) {
      console.error("Certificate creation failed:", certError);
      alert("Error creating certificate.");
      return;
    }

    const { error: studentCertError } = await supabase
      .from("student_certificates")
      .insert(studentCertToInsert);

    if (studentCertError) {
      console.error("Student certificate link failed:", studentCertError);
      alert("Error assigning certificate to student.");
    } else {
      alert("✅ Certificate successfully created and assigned!");
      // Optionally clear form
      setStudentName("");
      setStudentUniqueId("");
      setCourseName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Create & Assign Certificate
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Student Unique ID"
            value={studentUniqueId}
            onChange={(e) => setStudentUniqueId(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Course Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded"
        >
          Generate & Assign Certificate
        </button>
      </div>
    </div>
  );
}
