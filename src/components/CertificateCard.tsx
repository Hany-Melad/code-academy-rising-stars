import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import CertificateCard from "@/components/CertificateCard"; // Keep using CertificateCard for the list items
import { Button } from "@/components/ui/button"; // For the preview/download button
import { Download, FileText } from "lucide-react"; // Icons

import { Database } from "@/integrations/supabase/types";

declare global {
  interface Window {
    html2pdf: any;
  }
}

type StudentCertificateRow = Database['public']['Tables']['student_certificates']['Row'];
type CertificateRow = Database['public']['Tables']['certificates']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface AssignedCertificate extends StudentCertificateRow {
  certificates: CertificateRow;
}

const StudentCertificatesPage = () => {
  const { toast } = useToast();
  const [assignedCertificates, setAssignedCertificates] = useState<AssignedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<ProfileRow | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<AssignedCertificate | null>(null); // State for certificate preview
  const certificatePreviewRef = useRef<HTMLDivElement>(null); // Ref for the preview div

  // --- Profile and Certificates Fetching Logic (UNCHANGED) ---
  useEffect(() => {
    const fetchStudentProfile = async () => {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { /* ... error handling ... */ setLoading(false); return; }
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError || !profile) { /* ... error handling ... */ setLoading(false); return; }
      setStudentProfile(profile);
    };
    fetchStudentProfile();
  }, [toast]);

  useEffect(() => {
    if (!studentProfile?.unique_id) { return; }
    setLoading(true);
    const fetchCertificates = async () => {
      try {
        const { data, error } = await supabase
          .from('student_certificates')
          .select(`*, certificates (id, course_name, certificate_text, certificate_date, is_visible, created_at)`)
          .eq('student_unique_id', studentProfile.unique_id);
        if (error) throw error;
        setAssignedCertificates(data as unknown as AssignedCertificate[]);
      } catch (error) {
        console.error('Error fetching assigned certificates:', error);
        toast({ title: "Error", description: "Failed to load your certificates.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, [studentProfile, toast]);

  // --- Handle Download Logic (REVISED to work with the visible preview) ---
  const handleDownloadPdfFromPreview = async () => {
    if (!certificatePreviewRef.current || !selectedCertificate || !studentProfile) {
      toast({
        title: "Error",
        description: "No certificate selected for download or profile data missing.",
        variant: "destructive",
      });
      return;
    }

    // Now, the content is already visible, so no need for flash logic or opacity tricks
    setIsGenerating(true); 

    try {
      const images = certificatePreviewRef.current.getElementsByTagName('img');
      const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      });
      await Promise.all(promises);

      // A small delay after images load is still good practice
      await new Promise(resolve => setTimeout(resolve, 100));

      if (typeof window.html2pdf === 'undefined') {
        console.error('html2pdf.js not loaded.');
        toast({ title: "Error", description: "PDF generation library not loaded.", variant: "destructive" });
        return;
      }

      const opt = {
        margin: 0,
        filename: `${studentProfile.name.replace(/\s/g, '_')}_${selectedCertificate.certificates.course_name.replace(/\s/g, '_')}_Certificate.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
      };

      await window.html2pdf().set(opt).from(certificatePreviewRef.current).save();

      // Update download count in DB
      const { error: updateError } = await supabase
        .from('student_certificates')
        .update({ download_count: selectedCertificate.download_count + 1 })
        .eq('id', selectedCertificate.id)
        .select();

      if (updateError) {
        console.error('Error updating download count:', updateError.message);
        toast({ title: "Download Error", description: "Failed to update download count on database.", variant: "destructive" });
      } else {
        // Optimistically update the local state for the list of certificates
        setAssignedCertificates(prevCerts =>
          prevCerts.map(cert =>
            cert.id === selectedCertificate.id
              ? { ...cert, download_count: selectedCertificate.download_count + 1 }
              : cert
          )
        );
        // Also update the selected certificate's download count
        setSelectedCertificate(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);

        toast({ title: "Certificate Downloaded", description: `"${selectedCertificate.certificates.course_name}" has been downloaded.`, });
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Download Failed", description: "An error occurred while generating the PDF. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Render Loading/Error States (UNCHANGED) ---
  if (loading) { return ( <DashboardLayout><div className="p-8 text-center text-gray-600">Loading your certificates...</div></DashboardLayout> ); }
  if (!studentProfile) { return ( <DashboardLayout><div className="p-8 text-center text-red-500">Error: Could not retrieve student profile data. Please ensure you are logged in and have a profile.</div></DashboardLayout> ); }

  const { name: studentName, unique_id: studentUniqueIdForCards } = studentProfile;

  if (assignedCertificates.length === 0) { return ( <DashboardLayout><div className="p-8 text-center text-gray-600"><p className="text-lg">No certificates assigned to you yet.</p><p className="text-sm text-gray-500 mt-2">Keep up the great work in your courses!</p></div></DashboardLayout> ); }

  // --- Certificate ID for Display ---
  const generateDisplayCertId = (baseId: string) => `CERT-${baseId.substring(0, 8).toUpperCase()}`;

  // --- Render Certificates List and Optional Preview ---
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Certificates</h1>
          <p className="text-muted-foreground">View and download your earned course certificates.</p>
        </div>

        {/* List of Certificates (using CertificateCard for each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedCertificates.map((assignedCert) => (
            <div 
              key={assignedCert.id} 
              className="relative bg-white rounded-lg shadow-md p-6 flex flex-col justify-between border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCertificate(assignedCert)} // Set selected certificate on click
            >
              <FileText className="h-6 w-6 text-blue-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800">{assignedCert.certificates.course_name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{assignedCert.certificates.certificate_text}</p>
              <p className="text-sm text-gray-500">Awarded: {new Date(assignedCert.certificates.certificate_date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Downloads: {assignedCert.download_count}</p>
              <span className="absolute top-2 right-2 text-xs text-blue-500 font-bold">View</span>
            </div>
          ))}
        </div>

        {/* Certificate Preview Section (Conditionally rendered) */}
        {selectedCertificate && (
          <div className="mt-12 p-8 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold mb-6 text-center">Certificate Preview: {selectedCertificate.certificates.course_name}</h2>
            
            <div className="flex justify-center mb-6">
              <Button
                onClick={handleDownloadPdfFromPreview}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                disabled={isGenerating || !selectedCertificate.certificates.certificate_text}
              >
                {isGenerating ? 'Generating PDF...' : (
                  <>
                    <Download className="mr-3 h-6 w-6" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>

            {/* The actual certificate content to be rendered on the page */}
            {/* This div is now fully visible and will be used for PDF generation */}
            <div
              ref={certificatePreviewRef}
              // Tailwind classes applied to match original CSS
              className="mx-auto w-[1000px] h-[700px]
                         border-[10px] border-academy-blue p-[40px] box-border
                         bg-white shadow-xl shadow-academy-light-blue/20 flex flex-col items-center justify-center
                         text-center font-sans relative overflow-hidden" // Added relative and overflow-hidden for img positioning
            >
              {/* Images (relative to certificatePreviewRef container) */}
              <img src="https://i.postimg.cc/3xb1pWP1/icone-html-orange.png" className="absolute top-[40px] left-[40px] w-[100px] bg-academy-bg-light p-[5px]" crossOrigin="anonymous" alt="HTML Badge" />
              <img src="https://i.postimg.cc/G2nz8KtS/logo-2.png" className="absolute top-[40px] right-[40px] w-[120px] bg-academy-bg-light p-[5px]" crossOrigin="anonymous" alt="Logo" />
              <img src="https://i.postimg.cc/QtZpk7SQ/gold-badge-png-11552734724wixvd59trm.png" className="absolute top-[180px] right-[42px] w-[118px] drop-shadow-[0_0_8px_rgba(247,148,29,0.53)]" crossOrigin="anonymous" alt="Ribbon" />

              {/* Text Content */}
              <h1 className="text-[48px] text-academy-orange tracking-wider mb-[10px]">Certificate of Completion</h1>
              <h2 className="text-2xl font-serif text-academy-blue mt-0">proudly present this official</h2>
              <h1 className="text-[48px] text-academy-orange tracking-wider">CERTIFICATE</h1>
              <h2 className="text-2xl font-serif text-academy-blue">To Our Young Programmer</h2>

              <div className="text-[36px] font-bold text-academy-orange my-[30px] tracking-wide">
                {studentName}
              </div>
              <div className="text-lg leading-relaxed mx-auto w-[80%] text-academy-blue">
                For completing <span className="text-academy-orange font-bold">{selectedCertificate.certificates.course_name}</span> Course <br />
                By learning the <span className="text-academy-orange font-bold">{selectedCertificate.certificates.certificate_text}</span>
              </div>
              <div className="text-academy-blue text-base mt-[10px]">
                Awarded on: {new Date(selectedCertificate.certificates.certificate_date).toLocaleDateString()}
              </div>

              <div className="text-xl italic text-academy-orange mt-[30px]">we wish you all the best</div>
              <div className="stars text-[26px] text-academy-orange mt-[15px] drop-shadow-[0_0_6px_rgba(0,207,255,0.33)]">★★★★★</div>

              <div className="absolute bottom-[30px] left-[40px] text-sm text-academy-light-blue font-bold">
                Certificate ID: {generateDisplayCertId(selectedCertificate.id)}
              </div>
              <img src="https://i.postimg.cc/0NT61qwP/signature.png" className="absolute bottom-[30px] right-[60px] w-[150px] bg-academy-bg-light p-[3px]" crossOrigin="anonymous" alt="Signature" />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCertificatesPage;