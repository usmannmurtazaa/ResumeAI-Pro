import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export const exportService = {
  async exportAsPDF(element, filename = 'document.pdf') {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
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
      console.error('PDF export failed:', error);
      throw error;
    }
  },

  exportAsJSON(data, filename = 'data.json') {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, filename);
      return true;
    } catch (error) {
      console.error('JSON export failed:', error);
      throw error;
    }
  },

  exportAsTXT(data, filename = 'document.txt') {
    try {
      let textContent = '';
      
      // Format resume data as plain text
      if (data.personal) {
        textContent += `${data.personal.fullName || ''}\n`;
        textContent += `${data.personal.title || ''}\n`;
        textContent += `${data.personal.email || ''} | ${data.personal.phone || ''}\n\n`;
      }

      if (data.experience) {
        textContent += 'EXPERIENCE\n';
        textContent += '==========\n\n';
        data.experience.forEach(exp => {
          textContent += `${exp.title} at ${exp.company}\n`;
          textContent += `${exp.startDate} - ${exp.endDate || 'Present'}\n`;
          textContent += `${exp.description}\n\n`;
        });
      }

      if (data.education) {
        textContent += 'EDUCATION\n';
        textContent += '=========\n\n';
        data.education.forEach(edu => {
          textContent += `${edu.degree}\n`;
          textContent += `${edu.institution}, ${edu.graduationYear}\n\n`;
        });
      }

      if (data.skills?.technical) {
        textContent += 'SKILLS\n';
        textContent += '======\n\n';
        textContent += data.skills.technical.join(', ');
      }

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, filename);
      return true;
    } catch (error) {
      console.error('TXT export failed:', error);
      throw error;
    }
  },

  async exportAsDOCX(data, filename = 'resume.docx') {
    // This would require a library like docx
    // For now, we'll export as HTML that can be opened in Word
    try {
      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; }
              h2 { color: #666; border-bottom: 1px solid #ccc; }
              .section { margin-bottom: 20px; }
            </style>
          </head>
          <body>
      `;

      if (data.personal) {
        htmlContent += `<h1>${data.personal.fullName || ''}</h1>`;
        htmlContent += `<p><strong>${data.personal.title || ''}</strong></p>`;
        htmlContent += `<p>${data.personal.email || ''} | ${data.personal.phone || ''}</p>`;
      }

      if (data.experience) {
        htmlContent += '<h2>Experience</h2>';
        data.experience.forEach(exp => {
          htmlContent += `<div class="section">`;
          htmlContent += `<h3>${exp.title} - ${exp.company}</h3>`;
          htmlContent += `<p><em>${exp.startDate} - ${exp.endDate || 'Present'}</em></p>`;
          htmlContent += `<p>${exp.description}</p>`;
          htmlContent += `</div>`;
        });
      }

      if (data.education) {
        htmlContent += '<h2>Education</h2>';
        data.education.forEach(edu => {
          htmlContent += `<div class="section">`;
          htmlContent += `<h3>${edu.degree}</h3>`;
          htmlContent += `<p>${edu.institution}, ${edu.graduationYear}</p>`;
          htmlContent += `</div>`;
        });
      }

      htmlContent += '</body></html>';

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      saveAs(blob, filename);
      return true;
    } catch (error) {
      console.error('DOCX export failed:', error);
      throw error;
    }
  }
};