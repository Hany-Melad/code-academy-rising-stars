// src/pages/StudentCertificatesPage.tsx
import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import CertificateListItem from "@/components/CertificateListItem"; // NEW: Import the list item component
import CertificateCard from "@/components/CertificateCard"; // REVISED: Import the full certificate card
import { Button } from "@/components/ui/button"; // Still needed for general buttons
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
  const [selectedCertificate, setSelectedCertificate] = useState<AssignedCertificate | null>(null);
  // isGenerating state now belongs to CertificateCard, but we might keep it here
  // if we want a global loading indicator for PDF generation. For now, it's local to CertificateCard.

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
          // Ensure all new certificate fields are selected
          .select(`
            *,
            certificates (
              id, course_name, certificate_text, certificate_date, is_visible, created_at,
              header_image_url, footer_image_url, ribbon_image_url, logo_image_url,
              primary_color, secondary_color, background_color
            )
          `);
          // Removed the extra .eq() for student_unique_id as it was already in the select string.
          // Make sure your RLS is correct for student_certificates to filter by student_unique_id.
          // If you need the .eq(), add it back here: .eq('student_unique_id', studentProfile.unique_id);
          // Assuming your RLS on student_certificates already filters by student_unique_id.
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

  // --- Callback for when CertificateCard successfully downloads ---
  const handleDownloadSuccess = async (studentCertId: string, currentDownloadCount: number) => {
    try {
      const { error: updateError } = await supabase
        .from('student_certificates')
        .update({ download_count: currentDownloadCount + 1 })
        .eq('id', studentCertId)
        .select();

      if (updateError) {
        console.error('Error updating download count:', updateError.message);
        toast({ title: "Download Error", description: "Failed to update download count on database.", variant: "destructive" });
      } else {
        setAssignedCertificates(prevCerts =>
          prevCerts.map(cert =>
            cert.id === studentCertId
              ? { ...cert, download_count: currentDownloadCount + 1 }
              : cert
          )
        );
        // If the selected certificate was just downloaded, update its count too
        setSelectedCertificate(prev => prev && prev.id === studentCertId ? { ...prev, download_count: prev.download_count + 1 } : prev);
      }
    } catch (err) {
      console.error('Download success handler error:', err);
      toast({ title: "Error", description: "An unexpected error occurred after download.", variant: "destructive" });
    }
  };

  // --- Render Loading/Error States ---
  if (loading) { return ( <DashboardLayout><div className="p-8 text-center text-gray-600">Loading your certificates...</div></DashboardLayout> ); }
  if (!studentProfile) { return ( <DashboardLayout><div className="p-8 text-center text-red-500">Error: Could not retrieve student profile data. Please ensure you are logged in and have a profile.</div></DashboardLayout> ); }

  const { name: studentName } = studentProfile; // Only studentName is needed here

  if (assignedCertificates.length === 0) { return ( <DashboardLayout><div className="p-8 text-center text-gray-600"><p className="text-lg">No certificates assigned to you yet.</p><p className="text-sm text-gray-500 mt-2">Keep up the great work in your courses!</p></div></DashboardLayout> ); }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Your Certificates</h1>
          <p className="text-muted-foreground">View and download your earned course certificates.</p>
        </div>

        {/* List of Certificates (using CertificateListItem for each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedCertificates.map((assignedCert) => (
            <CertificateListItem
              key={assignedCert.id}
              assignedCertificate={assignedCert}
              onClick={setSelectedCertificate} // Pass the setter to select the certificate
            />
          ))}
        </div>

        {/* Full Certificate Preview (Conditionally rendered) */}
        {selectedCertificate && (
          <CertificateCard
            assignedCertificate={selectedCertificate}
            studentName={studentName}
            onDownloadSuccess={handleDownloadSuccess}
            onClosePreview={() => setSelectedCertificate(null)} // Close preview button
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCertificatesPage;