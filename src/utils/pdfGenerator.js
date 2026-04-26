import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DEFAULT_FILENAME = 'resume.pdf';
const DEFAULT_TEMPLATE = 'modern';
const DEFAULT_MARGIN_MM = 8;
const OFFSCREEN_WIDTH = '210mm';

const isDomElement = (value) =>
  typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;

const normalizeFilename = (filename) => {
  if (!filename) {
    return DEFAULT_FILENAME;
  }

  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
};

const buildResumeFilename = (resumeData, filename) => {
  if (filename) {
    return normalizeFilename(filename);
  }

  const fullName = resumeData?.personal?.fullName?.trim();
  const slug = fullName
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'resume'}.pdf`;
};

const waitForNextPaint = () =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

const waitForFonts = async () => {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Ignore font loading failures and continue with export.
  }
};

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img')).filter(
    (image) => !image.complete
  );

  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          const finish = () => {
            image.removeEventListener('load', finish);
            image.removeEventListener('error', finish);
            resolve();
          };

          image.addEventListener('load', finish, { once: true });
          image.addEventListener('error', finish, { once: true });
        })
    )
  );
};

const renderElementToCanvas = async (element, options = {}) => {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(element.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(element.scrollHeight, rect.height));

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: false,
    scale:
      options.scale ??
      Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
  });
};

const exportCanvasToPdf = (canvas, { filename, marginMm = DEFAULT_MARGIN_MM } = {}) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const printableWidth = pageWidth - marginMm * 2;
  const printableHeight = pageHeight - marginMm * 2;
  const scaleRatio = printableWidth / canvas.width;
  const pageHeightPx = Math.max(1, Math.floor(printableHeight / scaleRatio));

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to prepare the PDF canvas context.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      renderedHeightPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const imageData = pageCanvas.toDataURL('image/png');
    const renderedHeightMm = Math.min(printableHeight, sliceHeightPx * scaleRatio);

    pdf.addImage(
      imageData,
      'PNG',
      marginMm,
      marginMm,
      printableWidth,
      renderedHeightMm,
      undefined,
      'FAST'
    );

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(normalizeFilename(filename));

  return true;
};

const cleanupMountedPreview = (root, container) => {
  try {
    root?.unmount();
  } catch {
    // Ignore unmount issues during cleanup.
  }

  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
};

const mountResumePreview = async (resumeData, template) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = OFFSCREEN_WIDTH;
  container.style.maxWidth = OFFSCREEN_WIDTH;
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1';

  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    const { default: ResumePreview } = await import(
      '../components/resume/ResumePreview'
    );

    root.render(
      createElement(ResumePreview, {
        data: resumeData,
        template,
      })
    );

    await waitForFonts();
    await waitForNextPaint();
    await waitForImages(container);
    await waitForNextPaint();

    return { root, container };
  } catch (error) {
    cleanupMountedPreview(root, container);
    throw error;
  }
};

export const generateElementPDF = async (element, options = {}) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation is only available in the browser.');
  }

  if (!isDomElement(element)) {
    throw new Error('generateElementPDF expects a valid DOM element.');
  }

  try {
    const canvas = await renderElementToCanvas(element, options);

    return exportCanvasToPdf(canvas, {
      filename: options.filename || DEFAULT_FILENAME,
      marginMm: options.marginMm,
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const downloadResumeAsPDF = async (
  resumeData,
  template = DEFAULT_TEMPLATE,
  options = {}
) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation is only available in the browser.');
  }

  let root;
  let container;

  try {
    const mountedPreview = await mountResumePreview(resumeData, template);
    root = mountedPreview.root;
    container = mountedPreview.container;

    const canvas = await renderElementToCanvas(container, options);

    return exportCanvasToPdf(canvas, {
      filename: buildResumeFilename(resumeData, options.filename),
      marginMm: options.marginMm,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    cleanupMountedPreview(root, container);
  }
};

export const generatePDF = async (source, templateOrFilename, options = {}) => {
  if (isDomElement(source)) {
    const elementOptions =
      typeof templateOrFilename === 'object' && templateOrFilename !== null
        ? templateOrFilename
        : {
            ...options,
            filename:
              typeof templateOrFilename === 'string'
                ? templateOrFilename
                : options.filename,
          };

    return generateElementPDF(source, elementOptions);
  }

  const template =
    typeof templateOrFilename === 'string'
      ? templateOrFilename
      : templateOrFilename?.template || DEFAULT_TEMPLATE;

  const pdfOptions =
    typeof templateOrFilename === 'object' && templateOrFilename !== null
      ? templateOrFilename
      : options;

  return downloadResumeAsPDF(source, template, pdfOptions);
};
