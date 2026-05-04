import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_FILENAME = 'resume.pdf';
const DEFAULT_TEMPLATE = 'modern';
const DEFAULT_MARGIN_MM = 8;
const OFFSCREEN_WIDTH = '210mm'; // A4 width

const isDevelopment = process.env.NODE_ENV === 'development';

// ── Lazy-Loaded Heavy Dependencies ────────────────────────────────────────

let html2canvasModule = null;
let jsPDFModule = null;

const getHtml2Canvas = async () => {
  if (!html2canvasModule) {
    html2canvasModule = (await import('html2canvas')).default;
  }
  return html2canvasModule;
};

const getJsPDF = async () => {
  if (!jsPDFModule) {
    jsPDFModule = (await import('jspdf')).default;
  }
  return jsPDFModule;
};

// ── Utilities ──────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const isDomElement = (value) =>
  typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;

const normalizeFilename = (filename) => {
  if (!filename) return DEFAULT_FILENAME;
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
};

const buildResumeFilename = (resumeData, filename) => {
  if (filename) return normalizeFilename(filename);
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
  if (!isBrowser || !document.fonts?.ready) return;
  try {
    await document.fonts.ready;
  } catch {
    // Font loading failed — continue with fallback fonts
  }
};

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img')).filter(
    (img) => !img.complete
  );
  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          const finish = () => {
            img.removeEventListener('load', finish);
            img.removeEventListener('error', finish);
            resolve();
          };
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        })
    )
  );
};

// ── PDF Generation Core ───────────────────────────────────────────────────

const renderElementToCanvas = async (element, options = {}) => {
  const html2canvas = await getHtml2Canvas();

  const rect = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(element.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(element.scrollHeight, rect.height));

  // Cap scale at 2x for performance on high-DPI displays
  const scale = options.scale ?? Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: false,
    scale,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
  });
};

const exportCanvasToPdf = async (canvas, { filename, marginMm = DEFAULT_MARGIN_MM } = {}) => {
  const jsPDF = await getJsPDF();

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
    if (pageIndex > 0) pdf.addPage();

    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext('2d');
    if (!context) throw new Error('Failed to create canvas context.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas, 0, renderedHeightPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx
    );

    const imageData = pageCanvas.toDataURL('image/png');
    const renderedHeightMm = Math.min(printableHeight, sliceHeightPx * scaleRatio);

    pdf.addImage(imageData, 'PNG', marginMm, marginMm, printableWidth, renderedHeightMm, undefined, 'FAST');

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(normalizeFilename(filename));
  return true;
};

// ── Offscreen Preview Rendering ───────────────────────────────────────────

const cleanupMountedPreview = (root, container) => {
  try {
    root?.unmount();
  } catch (error) {
    if (isDevelopment) console.warn('Cleanup unmount failed:', error);
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
  }
};

const mountResumePreview = async (resumeData, template) => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: ${OFFSCREEN_WIDTH}; max-width: ${OFFSCREEN_WIDTH};
    background: #ffffff; pointer-events: none; z-index: -1;
  `;
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    const { default: ResumePreview } = await import('../components/resume/ResumePreview');
    root.render(createElement(ResumePreview, { data: resumeData, template }));

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

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate PDF from a DOM element.
 */
export const generateElementPDF = async (element, options = {}) => {
  if (!isBrowser) throw new Error('PDF generation requires a browser environment.');
  if (!isDomElement(element)) throw new Error('Expected a valid DOM element.');

  try {
    const canvas = await renderElementToCanvas(element, options);
    return exportCanvasToPdf(canvas, {
      filename: options.filename || DEFAULT_FILENAME,
      marginMm: options.marginMm,
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generate PDF from resume data using offscreen rendering.
 */
export const downloadResumeAsPDF = async (resumeData, template = DEFAULT_TEMPLATE, options = {}) => {
  if (!isBrowser) throw new Error('PDF generation requires a browser environment.');

  let root;
  let container;

  try {
    const preview = await mountResumePreview(resumeData, template);
    root = preview.root;
    container = preview.container;

    const canvas = await renderElementToCanvas(container, options);
    return exportCanvasToPdf(canvas, {
      filename: buildResumeFilename(resumeData, options.filename),
      marginMm: options.marginMm,
    });
  } catch (error) {
    console.error('Error generating resume PDF:', error);
    throw error;
  } finally {
    cleanupMountedPreview(root, container);
  }
};

/**
 * Unified PDF generation — accepts either a DOM element or resume data.
 *
 * @example
 * // From DOM element
 * await generatePDF(document.getElementById('resume'));
 *
 * // From resume data
 * await generatePDF(resumeData, 'modern', { filename: 'my-resume.pdf' });
 */
export const generatePDF = async (source, templateOrOptions, options = {}) => {
  if (isDomElement(source)) {
    const opts = typeof templateOrOptions === 'object' ? templateOrOptions : { ...options, filename: templateOrOptions || options.filename };
    return generateElementPDF(source, opts);
  }

  const template = typeof templateOrOptions === 'string' ? templateOrOptions : (templateOrOptions?.template || DEFAULT_TEMPLATE);
  const opts = typeof templateOrOptions === 'object' ? templateOrOptions : options;
  return downloadResumeAsPDF(source, template, opts);
};