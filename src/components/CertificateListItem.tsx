// src/components/CertificateListItem.tsx
import React from 'react';
import { FileText } from 'lucide-react';
import { Database } from "@/integrations/supabase/types"; // Adjust path

type StudentCertificateRow = Database['public']['Tables']['student_certificates']['Row'];
type CertificateRow = Database['public']['Tables']['certificates']['Row'];

interface AssignedCertificate extends StudentCertificateRow {
  certificates: CertificateRow;
}

interface CertificateListItemProps {
  assignedCertificate: AssignedCertificate;
  onClick: (certificate: AssignedCertificate) => void;
}

const CertificateListItem: React.FC<CertificateListItemProps> = ({ assignedCertificate, onClick }) => {
  const { certificates: certificateDetails } = assignedCertificate;

  return (
    <div
      className="relative bg-white rounded-lg shadow-md p-6 flex flex-col justify-between border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(assignedCertificate)}
    >
      <FileText className="h-6 w-6 text-blue-500 mb-3" />
      <h3 className="text-lg font-semibold text-gray-800">{certificateDetails.course_name}</h3>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{certificateDetails.certificate_text}</p>
      <p className="text-sm text-gray-500">Awarded: {new Date(certificateDetails.certificate_date).toLocaleDateString()}</p>
      <p className="text-sm text-gray-500">Downloads: {assignedCertificate.download_count}</p>
      <span className="absolute top-2 right-2 text-xs text-blue-500 font-bold">View</span>
    </div>
  );
};

export default CertificateListItem;