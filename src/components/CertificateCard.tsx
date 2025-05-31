// src/components/CertificateCard.tsx
import React, { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

declare global {
  interface Window {
    html2pdf: any;
  }
}

type StudentCertificateRow = Database['public']['Tables']['student_certificates']['Row'];
type CertificateRow = Database['public']['Tables']['certificates']['Row'];

interface AssignedCertificate extends StudentCertificateRow {
  certificates: CertificateRow;
}

interface CertificateCardProps {
  assignedCertificate: AssignedCertificate;
  studentName: string;
  onDownloadSuccess: (studentCertId: string, currentDownloadCount: number) => void;
  onClosePreview: () => void;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ assignedCertificate, studentName, onDownloadSuccess, onClosePreview }) => {
  const { certificates: certificateDetails, download_count, id: studentCertId, student_name: studentCertificateName } = assignedCertificate;

  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Default colors and image URLs (unchanged)
  const defaultColors = {
    primary: '#F7941D',
    secondary: '#004B8D',
    background: '#e6f7fb',
    accent: '#00CFFF',
  };

  const defaultImageUrls = {
    header: "https://i.postimg.cc/3xb1pWP1/icone-html-orange.png",
    logo: "https://i.postimg.cc/G2nz8KtS/logo-2.png",
    ribbon: "https://i.postimg.cc/QtZpk7SQ/gold-badge-png-11552734724wixvd59trm.png",
    signature: "https://i.postimg.cc/0NT61qwP/signature.png",
  };

  const currentColors = {
    primary: certificateDetails.primary_color || defaultColors.primary,
    secondary: certificateDetails.secondary_color || defaultColors.secondary,
    background: certificateDetails.background_color || defaultColors.background,
    accent: defaultColors.accent,
  };

  const currentImageUrls = {
    header: certificateDetails.header_image_url || defaultImageUrls.header,
    logo: certificateDetails.logo_image_url || defaultImageUrls.logo,
    ribbon: certificateDetails.ribbon_image_url || defaultImageUrls.ribbon,
    signature: certificateDetails.footer_image_url || defaultImageUrls.signature,
  };

  const generateDisplayCertId = (baseId: string) => {
    return `CERT-${baseId.substring(0, 8).toUpperCase()}`;
  };

  const handleGeneratePdf = async () => {
    if (!certificateRef.current) {
      toast({
        title: "Error",
        description: "Certificate content not found for PDF generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const images = certificateRef.current.getElementsByTagName('img');
      const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      });
      await Promise.all(promises);

      await new Promise(resolve => setTimeout(resolve, 100));

      if (typeof window.html2pdf === 'undefined') {
        console.error('html2pdf.js not loaded.');
        toast({ title: "Error", description: "PDF generation library not loaded.", variant: "destructive" });
        return;
      }

      const opt = {
        // --- KEY CHANGE: Add margin here ---
        margin: 28.35, // Approximately 10mm margin on all sides (since unit is 'pt')
        // You can also specify an array for custom margins:
        // margin: [28.35, 28.35, 28.35, 28.35], // [top, left, bottom, right]
        filename: `${(studentCertificateName || studentName).replace(/\s/g, '_')}_${certificateDetails.course_name.replace(/\s/g, '_')}_Certificate.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
      };

      await window.html2pdf().set(opt).from(certificateRef.current).save();

      onDownloadSuccess(studentCertId, download_count);

      toast({
        title: "Certificate Downloaded",
        description: `"${certificateDetails.course_name}" has been downloaded.`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "An error occurred while generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-12 p-8 bg-gray-100 rounded-lg shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Certificate Preview: {certificateDetails.course_name}</h2>
        <Button onClick={onClosePreview} variant="ghost" className="text-gray-500 hover:text-gray-700">
          Close Preview
        </Button>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          onClick={handleGeneratePdf}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
          disabled={isGenerating || !certificateDetails.certificate_text}
        >
          {isGenerating ? 'Generating PDF...' : (
            <>
              <Download className="mr-3 h-6 w-6" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* The actual certificate content to be rendered on the page and captured by html2pdf */}
      <div
        ref={certificateRef}
   style={{
                width: '1010px', // You opted to keep these specific dimensions
                height: '700px',
                border: '5px solid #00AEEF',
                boxSizing: 'border-box',



                    
          borderColor: currentColors.secondary,
          backgroundColor: currentColors.background,
          boxShadow: `0 0 30px ${currentColors.accent}33`,
          // IMPORTANT: If you want these dimensions (1063x734) to be the *actual* PDF dimensions,
          // then you need to adjust jsPDF.format to 'custom' and pass these values in pt.
          // For A4 landscape, stick with 842px x 596px for the HTML div.
          // The inline style below is likely for display purposes only, but if you want it
          // to control PDF output size, you need to sync it with jsPDF options.
          // For now, I'm assuming you want A4 landscape output, so the 842x596px in className is the target.
          // The specific 'style' prop you provided previously:
          // width: '1063px',
          // height: '734px',
          // left: '3px',
          // backgroundColor: 'white', // Overlaps with Tailwind bg-white
          // border: '5px solid #00AEEF', // Overlaps with Tailwind border-[10px]
          // boxSizing: 'border-box' // Overlaps with Tailwind box-border

              }}
              // Removed redundant width/height from Tailwind as inline style takes precedence
              // Changed 'bg-red' to 'bg-white' assuming typo
            


        // Keeping your previous dimensions for display and the inline style for specific overrides
        className="mx-auto w-[842px] h-[596px]
                   border-[10px] p-[70px] box-border
                   bg-white shadow-xl flex flex-col items-center justify-center
                   text-center font-sans relative overflow-hidden"
       
      >
        {/* Images with dynamic sources */}
        <img src={currentImageUrls.header} className="absolute top-[70px] left-[40px] w-[100px] p-[5px]" style={{ backgroundColor: currentColors.background }} crossOrigin="anonymous" alt="HTML Badge" />
        <img src={currentImageUrls.logo} className="absolute top-[70px] right-[40px] w-[120px] p-[5px]" style={{ backgroundColor: currentColors.background }} crossOrigin="anonymous" alt="Logo" />
        <img src={currentImageUrls.ribbon} className="absolute top-[180px] right-[42px] w-[118px]" style={{ filter: `drop-shadow(0 0 8px ${currentColors.primary}88)` }} crossOrigin="anonymous" alt="Ribbon" />

        {/* Text Content with dynamic colors */}
        <h1 className="text-[48px] tracking-wider mb-[10px]" style={{ color: currentColors.primary }}>Certificate of Completion</h1>
        <h2 className="text-2xl font-serif mt-0 mb-4" style={{ color: currentColors.secondary }}>proudly present this official</h2>
        <h1 className="text-[48px] tracking-wider mt-0 mb-2" style={{ color: currentColors.primary }}>CERTIFICATE</h1>
        <h2 className="text-2xl font-serif mt-0" style={{ color: currentColors.secondary }}>To Our Young Programmer</h2>

        <div className="text-[36px] font-bold my-[30px] tracking-wide" style={{ color: currentColors.primary }}>
          {studentCertificateName || studentName}
        </div>
        <div className="text-lg leading-relaxed mx-auto w-[80%]" style={{ color: currentColors.secondary }}>
          For completing <span className="font-bold" style={{ color: currentColors.primary }}>{certificateDetails.course_name}</span> Course <br />
          By learning the <span className="font-bold" style={{ color: currentColors.primary }}>{certificateDetails.certificate_text}</span>
        </div>
        <div className="text-base mt-[10px]" style={{ color: currentColors.secondary }}>
          Awarded on: {new Date(certificateDetails.certificate_date).toLocaleDateString()}
        </div>

        <div className="text-xl italic mt-[30px]" style={{ color: currentColors.primary }}>we wish you all the best</div>
        <div className="text-[26px] mt-[15px] drop-shadow-[0_0_6px_rgba(0,207,255,0.33)]" style={{ color: currentColors.primary }}>★★★★★</div>

        <div className="absolute bottom-[30px] left-[40px] text-sm font-bold" style={{ color: currentColors.accent }}>
          Certificate ID: {generateDisplayCertId(studentCertId)}
        </div>
        <img src={currentImageUrls.signature} className="absolute bottom-[30px] right-[60px] w-[150px] p-[3px]" style={{ backgroundColor: currentColors.background }} crossOrigin="anonymous" alt="Signature" />
      </div>
    </div>
  );
};

export default CertificateCard;