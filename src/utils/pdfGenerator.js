import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (element, filename = 'resume.pdf') => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCQRS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const downloadResumeAsPDF = async (resumeData, template) => {
  // Create a temporary div for rendering
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.backgroundColor = 'white';
  document.body.appendChild(tempDiv);

  try {
    // Render resume template
    const ReactDOM = await import('react-dom/client');
    const { default: ResumePreview } = await import('../components/resume/ResumePreview');
    
    const root = ReactDOM.createRoot(tempDiv);
    await new Promise(resolve => {
      root.render(<ResumePreview data={resumeData} template={template} />);
      setTimeout(resolve, 500); // Wait for render
    });

    // Generate PDF
    await generatePDF(tempDiv, `resume_${Date.now()}.pdf`);

    // Cleanup
    root.unmount();
    document.body.removeChild(tempDiv);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.removeChild(tempDiv);
    throw error;
  }
};