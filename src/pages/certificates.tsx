import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Certificates() {
  const [studentName, setStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [studentUniqueId, setStudentUniqueId] = useState('');
  const [certificateId, setCertificateId] = useState(uuidv4());

  const handleGenerate = async () => {
    const certText = `For completing ${courseName} Course with focus on ${description}, from ${startDate} until ${endDate}`;

    const { data: certData, error: certError } = await supabase
      .from('certificates')
      .insert({
        id: certificateId,
        course_name: courseName,
        certificate_text: certText,
        certificate_date: new Date().toISOString().split('T')[0],
        is_visible: true
      })
      .select();

    if (certError) {
      console.error('Certificate creation failed:', certError);
      return;
    }

    const { error: studentCertError } = await supabase
      .from('student_certificates')
      .insert({
        student_unique_id: studentUniqueId,
        certificate_id: certificateId,
        student_name: studentName
      });

    if (studentCertError) {
      console.error('Student certificate link failed:', studentCertError);
    } else {
      alert('Certificate successfully created and assigned!');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">Create & Assign Certificate</h2>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Student Name" value={studentName} onChange={e => setStudentName(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Student Unique ID" value={studentUniqueId} onChange={e => setStudentUniqueId(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Course Name" value={courseName} onChange={e => setCourseName(e.target.value)} className="p-2 border rounded" />
          <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="p-2 border rounded" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded" />
        </div>
        <button onClick={handleGenerate} className="mt-6 w-full bg-orange-500 text-white font-bold py-2 rounded hover:bg-orange-600">Generate & Assign Certificate</button>
      </div>
    </div>
  );
}
// This code creates a simple certificate generation and assignment page using React and Supabase.
// It allows users to input student and course details, generates a certificate text, and saves it to the Supabase database.