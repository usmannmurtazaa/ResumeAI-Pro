import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { getResumeTemplateLoader } from '../components/resume/templates/resolveTemplate';

// ── Why this file has two output layers ───────────────────────────────────
//
// The exported PDF contains:
//
//   1. A visual layer  - the mounted template captured as a canvas via
//                        html2canvas, drawn on the PDF with jsPDF.addImage.
//                        This preserves the exact styling of the chosen
//                        template (colours, fonts, layout).
//
//   2. A text layer    - every visible text node in the mounted DOM,
//                        extracted with TreeWalker and placed at its
//                        corresponding position with jsPDF.text(), drawn
//                        BEFORE the image so the image covers it visually.
//
// Only image PDFs (the previous behaviour) are invisible to ATS scanners
// because automated systems extract text, not pixels. By adding the text
// layer, the same PDF is both visually faithful and machine-readable.
// Screen readers and copy-paste also work as a side effect.
//
// The order is deliberate: text first, image second. ATS extractors read
// the entire PDF content stream regardless of z-order, so the text is
// still fully extractable, and the image always wins visually.
//
// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_FILENAME = 'resume.pdf';
const DEFAULT_TEMPLATE = 'modern';
const DEFAULT_MARGIN_MM = 8;
const OFFSCREEN_WIDTH = '210mm'; // A4 width

// A single text node longer than this is skipped. A pathological DOM could
// otherwise hand an enormous string to jsPDF. 10 KB is far larger than any
// realistic resume line, so no legitimate content is dropped.
const MAX_TEXT_NODE_LENGTH = 10_000;

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

const isDomElement = (value) => typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;

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
    // Font loading failed - continue with fallback fonts
  }
};

const waitForImages = async (container) => {
  const images = Array.from(container.querySelectorAll('img')).filter((img) => !img.complete);
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

// ── Text Extraction ───────────────────────────────────────────────────────
//
// Walks the mounted DOM and records every visible text node with its
// position and font metadata. The recorded positions are in CSS pixels
// relative to the container, matching the coordinate space of the canvas
// produced by html2canvas.

const extractTextNodes = (container) => {
  if (!isBrowser || !container) return [];

  const containerRect = container.getBoundingClientRect();
  const nodes = [];

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.textContent;
      if (!text || !text.trim()) return NodeFilter.FILTER_REJECT;
      if (text.length > MAX_TEXT_NODE_LENGTH) return NodeFilter.FILTER_REJECT;

      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      const style = window.getComputedStyle(parent);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        parseFloat(style.opacity) === 0
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;

    let rects;
    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    } catch {
      // Range on a detached node - skip.
      continue;
    }

    if (rects.length === 0) continue;

    const style = window.getComputedStyle(parent);
    const fontSizePx = parseFloat(style.fontSize) || 12;
    const fontWeight = parseInt(style.fontWeight, 10) || 400;

    // The first rect determines the position. The widest rect determines
    // jsPDF's wrap width - using the max width ensures multi-line text is
    // never clipped to the narrower first line.
    const firstRect = rects[0];
    const maxWidthPx = rects.reduce((max, r) => Math.max(max, r.width), 0);

    nodes.push({
      text: node.textContent,
      x: firstRect.left - containerRect.left,
      y: firstRect.top - containerRect.top,
      width: maxWidthPx,
      fontSizePx,
      fontWeight,
    });
  }

  return nodes;
};

// ── PDF Generation Core ───────────────────────────────────────────────────

const renderElementToCanvas = async (element, options = {}) => {
  const html2canvas = await getHtml2Canvas();

  const rect = element.getBoundingClientRect();
  const width = Math.ceil(Math.max(element.scrollWidth, rect.width));
  const height = Math.ceil(Math.max(element.scrollHeight, rect.height));

  // Lower scale from 3 to 2 for better performance while maintaining quality.
  const scale = options.scale ?? 2;

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
    scale,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    onclone: (documentClone) => {
      // Ensure fonts are loaded in the cloned document.
      if (documentClone.fonts?.ready) {
        return documentClone.fonts.ready;
      }
    },
  });
};

// Places every text node whose y falls within a given PDF page's pixel
// range at the corresponding (x, y) on the PDF. Called once per page with
// the subset of nodes that belong on that page. Individual placement
// failures are caught and logged; they never abort the export.
const drawTextLayerForPage = (
  pdf,
  textNodes,
  page,
  { marginMm, mmPerDomPx, scaleMmPerCanvasPx, canvasWidthPx, containerWidthPx }
) => {
  const { pageTopPx, pageBottomPx } = page;

  textNodes.forEach((node) => {
    // Convert the DOM y position to canvas pixels so we can compare against
    // the page slice's pixel bounds. `canvasWidthPx / containerWidthPx` is
    // the effective html2canvas scale factor.
    const yCanvasPx = node.y * (canvasWidthPx / containerWidthPx);
    if (yCanvasPx < pageTopPx || yCanvasPx >= pageBottomPx) return;

    const xMm = marginMm + node.x * mmPerDomPx;
    const yMm = marginMm + (yCanvasPx - pageTopPx) * scaleMmPerCanvasPx;
    const sizeMm = node.fontSizePx * mmPerDomPx;
    const maxWidthMm = node.width * mmPerDomPx;

    try {
      const fontStyle = node.fontWeight >= 600 ? 'bold' : 'normal';
      pdf.setFont('helvetica', fontStyle);
      pdf.setFontSize(sizeMm);
      pdf.text(node.text, xMm, yMm + sizeMm, {
        maxWidth: maxWidthMm,
        baseline: 'top',
      });
    } catch (error) {
      if (isDevelopment) console.warn('Failed to place text node:', error);
    }
  });
};

// Assembles the final PDF. For each page: draw the text layer first, then
// draw the canvas slice on top. The canvas covers the text visually while
// the text remains in the PDF's content stream for extraction.
const exportCanvasAndTextToPdf = async (
  canvas,
  textNodes,
  container,
  { filename, marginMm = DEFAULT_MARGIN_MM } = {}
) => {
  const jsPDF = await getJsPDF();

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const printableWidthMm = pageWidthMm - marginMm * 2;
  const printableHeightMm = pageHeightMm - marginMm * 2;

  const scaleMmPerCanvasPx = printableWidthMm / canvas.width;
  const pageHeightCanvasPx = Math.max(1, Math.floor(printableHeightMm / scaleMmPerCanvasPx));

  const containerWidthPx = Math.max(
    1,
    container.scrollWidth || container.getBoundingClientRect().width || canvas.width
  );
  const mmPerDomPx = printableWidthMm / containerWidthPx;

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    if (pageIndex > 0) pdf.addPage();

    const pageTopPx = renderedHeightPx;
    const pageBottomPx = Math.min(canvas.height, renderedHeightPx + pageHeightCanvasPx);

    // 1. Text layer (drawn first so the image layer covers it visually).
    if (textNodes.length > 0) {
      drawTextLayerForPage(
        pdf,
        textNodes,
        { pageTopPx, pageBottomPx },
        {
          marginMm,
          mmPerDomPx,
          scaleMmPerCanvasPx,
          canvasWidthPx: canvas.width,
          containerWidthPx,
        }
      );
    }

    // 2. Image layer (drawn on top of the text).
    const sliceHeightPx = pageBottomPx - pageTopPx;
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext('2d');
    if (!context) throw new Error('Failed to create canvas context.');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      pageTopPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const imageData = pageCanvas.toDataURL('image/png');
    const renderedHeightMm = Math.min(printableHeightMm, sliceHeightPx * scaleMmPerCanvasPx);

    pdf.addImage(
      imageData,
      'PNG',
      marginMm,
      marginMm,
      printableWidthMm,
      renderedHeightMm,
      undefined,
      'FAST'
    );

    renderedHeightPx = pageBottomPx;
    pageIndex += 1;

    // Release memory from the temporary canvas.
    pageCanvas.width = 0;
    pageCanvas.height = 0;
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
    const loader = getResumeTemplateLoader(template);
    const { default: TemplateComponent } = await loader();
    root.render(createElement(TemplateComponent, { data: resumeData }));

    await waitForFonts();
    await waitForNextPaint();
    await waitForImages(container);
    await waitForNextPaint();

    // Extract the text layer while the DOM is still mounted. This must
    // happen BEFORE cleanupMountedPreview unmounts the container.
    const textNodes = extractTextNodes(container);

    return { root, container, textNodes };
  } catch (error) {
    cleanupMountedPreview(root, container);
    throw error;
  }
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a PDF from a DOM element.
 *
 * The element is captured as a canvas for the visual layer, and its text
 * content is extracted as a machine-readable layer underneath.
 */
export const generateElementPDF = async (element, options = {}) => {
  if (!isBrowser) throw new Error('PDF generation requires a browser environment.');
  if (!isDomElement(element)) throw new Error('Expected a valid DOM element.');

  try {
    const canvas = await renderElementToCanvas(element, options);
    const textNodes = extractTextNodes(element);
    return exportCanvasAndTextToPdf(canvas, textNodes, element, {
      filename: options.filename || DEFAULT_FILENAME,
      marginMm: options.marginMm,
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generate a PDF from resume data using offscreen template rendering.
 *
 * The template is mounted offscreen, captured as a canvas for the visual
 * layer, and its text content is extracted as a machine-readable layer
 * underneath. The offscreen container is unmounted in a `finally` block so
 * a failed export never leaves a stray DOM node behind.
 */
export const downloadResumeAsPDF = async (
  resumeData,
  template = DEFAULT_TEMPLATE,
  options = {}
) => {
  if (!isBrowser) throw new Error('PDF generation requires a browser environment.');

  let root;
  let container;
  let textNodes = [];

  try {
    const preview = await mountResumePreview(resumeData, template);
    root = preview.root;
    container = preview.container;
    textNodes = preview.textNodes;

    const canvas = await renderElementToCanvas(container, options);
    return exportCanvasAndTextToPdf(canvas, textNodes, container, {
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
 * Unified PDF entry point - accepts either a DOM element (for
 * `generateElementPDF`) or resume data (for `downloadResumeAsPDF`).
 */
export const generatePDF = async (source, templateOrOptions, options = {}) => {
  if (isDomElement(source)) {
    const opts =
      typeof templateOrOptions === 'object'
        ? templateOrOptions
        : { ...options, filename: templateOrOptions || options.filename };
    return generateElementPDF(source, opts);
  }

  const template =
    typeof templateOrOptions === 'string'
      ? templateOrOptions
      : templateOrOptions?.template || DEFAULT_TEMPLATE;
  const opts = typeof templateOrOptions === 'object' ? templateOrOptions : options;
  return downloadResumeAsPDF(source, template, opts);
};
