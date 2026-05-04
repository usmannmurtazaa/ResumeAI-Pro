/**
 * Export Service
 * Handles exporting resume data in multiple formats: PDF, JSON, TXT, DOCX-like HTML.
 * All heavy dependencies are lazy-loaded for optimal bundle size.
 */

// ── Utilities ──────────────────────────────────────────────────────────────

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

const sanitizeFilename = (name) => {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 100) || 'document';
};

// ── PDF Export ────────────────────────────────────────────────────────────

const exportAsPDF = async (element, filename = 'resume.pdf') => {
  if (!element) throw new Error('No element provided for PDF export');

  try {
    // Lazy load heavy dependencies
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const html2canvas = html2canvasModule.default;
    const jsPDF = jsPDFModule.default;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    // Handle multi-page content
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    let remainingHeight = scaledHeight;
    let position = 0;
    let page = 1;

    while (remainingHeight > 0) {
      if (page > 1) pdf.addPage();

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(imgHeight - (position / ratio), pdfHeight / ratio);

      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(
        canvas,
        0, position / ratio, imgWidth, pageCanvas.height,
        0, 0, imgWidth, pageCanvas.height
      );

      const pageImgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(
        pageImgData, 'PNG',
        (pdfWidth - scaledWidth) / 2, 0,
        scaledWidth, Math.min(scaledHeight, pdfHeight)
      );

      remainingHeight -= pdfHeight;
      position += pdfHeight;
      page++;
    }

    pdf.save(sanitizeFilename(filename));
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// ── JSON Export ───────────────────────────────────────────────────────────

const exportAsJSON = (data, filename = 'resume.json') => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, sanitizeFilename(filename));
    return true;
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Failed to export JSON.');
  }
};

// ── TXT Export ────────────────────────────────────────────────────────────

const exportAsTXT = (data, filename = 'resume.txt') => {
  try {
    const lines = [];

    // Personal Info
    if (data?.personal) {
      const p = data.personal;
      if (p.fullName) lines.push(p.fullName.toUpperCase());
      if (p.title) lines.push(p.title);
      const contact = [p.email, p.phone, p.location].filter(Boolean).join(' | ');
      if (contact) lines.push(contact);
      if (p.website) lines.push(p.website);
      if (p.linkedin) lines.push(p.linkedin);
      lines.push('');
    }

    // Summary
    if (data?.personal?.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push('='.repeat(20));
      lines.push(data.personal.summary);
      lines.push('');
    }

    // Experience
    if (Array.isArray(data?.experience) && data.experience.length > 0) {
      lines.push('EXPERIENCE');
      lines.push('='.repeat(20));
      data.experience.forEach(exp => {
        lines.push(`${exp.title} | ${exp.company}`);
        lines.push(`${exp.startDate || ''} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}`);
        if (exp.description) {
          lines.push(exp.description.replace(/•/g, '\n•'));
        }
        lines.push('');
      });
    }

    // Education
    if (Array.isArray(data?.education) && data.education.length > 0) {
      lines.push('EDUCATION');
      lines.push('='.repeat(20));
      data.education.forEach(edu => {
        lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`);
        lines.push(`${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`);
        if (edu.startDate) lines.push(`${edu.startDate} - ${edu.endDate || 'Present'}`);
        lines.push('');
      });
    }

    // Skills
    const allSkills = [
      ...(Array.isArray(data?.skills?.technical) ? data.skills.technical : []),
      ...(Array.isArray(data?.skills?.soft) ? data.skills.soft : []),
      ...(Array.isArray(data?.skills?.languages) ? data.skills.languages : []),
    ];
    if (allSkills.length > 0) {
      lines.push('SKILLS');
      lines.push('='.repeat(20));
      lines.push(allSkills.join(', '));
      lines.push('');
    }

    // Certifications
    if (Array.isArray(data?.certifications) && data.certifications.length > 0) {
      lines.push('CERTIFICATIONS');
      lines.push('='.repeat(20));
      data.certifications.forEach(cert => {
        lines.push(`${cert.name} - ${cert.issuer}${cert.date ? ` (${cert.date})` : ''}`);
      });
      lines.push('');
    }

    // Projects
    if (Array.isArray(data?.projects) && data.projects.length > 0) {
      lines.push('PROJECTS');
      lines.push('='.repeat(20));
      data.projects.forEach(proj => {
        lines.push(proj.name);
        if (proj.description) lines.push(proj.description);
        if (proj.link) lines.push(`Link: ${proj.link}`);
        lines.push('');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, sanitizeFilename(filename));
    return true;
  } catch (error) {
    console.error('TXT export failed:', error);
    throw new Error('Failed to export TXT.');
  }
};

// ── DOCX-like Export ──────────────────────────────────────────────────────

const exportAsDOCX = (data, filename = 'resume.docx') => {
  try {
    const lines = [];

    const style = `
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        h2 { font-size: 16px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px; }
        h3 { font-size: 14px; margin-bottom: 2px; }
        .contact { color: #666; font-size: 13px; margin-bottom: 12px; }
        .dates { color: #888; font-size: 12px; }
        ul { margin: 4px 0; padding-left: 20px; }
        li { margin-bottom: 2px; }
      </style>`;

    lines.push(`<html><head>${style}</head><body>`);

    // Personal
    if (data?.personal) {
      const p = data.personal;
      if (p.fullName) lines.push(`<h1>${p.fullName}</h1>`);
      if (p.title) lines.push(`<p><strong>${p.title}</strong></p>`);
      const contact = [p.email, p.phone, p.location].filter(Boolean).join(' | ');
      if (contact) lines.push(`<p class="contact">${contact}</p>`);
    }

    // Summary
    if (data?.personal?.summary) {
      lines.push('<h2>Professional Summary</h2>');
      lines.push(`<p>${data.personal.summary}</p>`);
    }

    // Experience
    if (Array.isArray(data?.experience) && data.experience.length > 0) {
      lines.push('<h2>Experience</h2>');
      data.experience.forEach(exp => {
        lines.push(`<h3>${exp.title} — ${exp.company}</h3>`);
        lines.push(`<p class="dates">${exp.startDate || ''} - ${exp.endDate || 'Present'}${exp.location ? ` | ${exp.location}` : ''}</p>`);
        if (exp.description) {
          const bullets = exp.description.split('\n').filter(Boolean).map(b => `<li>${b.replace(/^[•\-]\s*/, '')}</li>`);
          lines.push(`<ul>${bullets.join('')}</ul>`);
        }
      });
    }

    // Education
    if (Array.isArray(data?.education) && data.education.length > 0) {
      lines.push('<h2>Education</h2>');
      data.education.forEach(edu => {
        lines.push(`<h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>`);
        lines.push(`<p>${edu.institution}${edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</p>`);
        if (edu.startDate) lines.push(`<p class="dates">${edu.startDate} - ${edu.endDate || 'Present'}</p>`);
      });
    }

    // Skills
    const allSkills = [
      ...(Array.isArray(data?.skills?.technical) ? data.skills.technical : []),
      ...(Array.isArray(data?.skills?.soft) ? data.skills.soft : []),
    ];
    if (allSkills.length > 0) {
      lines.push('<h2>Skills</h2>');
      lines.push(`<p>${allSkills.join(', ')}</p>`);
    }

    lines.push('</body></html>');

    const blob = new Blob([lines.join('\n')], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    downloadBlob(blob, sanitizeFilename(filename));
    return true;
  } catch (error) {
    console.error('DOCX export failed:', error);
    throw new Error('Failed to export document.');
  }
};

// ── Export Service API ────────────────────────────────────────────────────

export const exportService = {
  exportAsPDF,
  exportAsJSON,
  exportAsTXT,
  exportAsDOCX,
};

export default exportService;