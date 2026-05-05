import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiDownload, FiMaximize, FiMinimize, FiLoader, FiZoomIn, FiZoomOut,
  FiRotateCcw, FiAlertCircle, FiCheck, FiPrinter, FiShare2,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;
const CONTROLS_HIDE_DELAY = 3000;

// ── Utility Functions ────────────────────────────────────────────────────

const downloadResumeAsPDF = async (data, template) => {
  // FIXED: Placeholder implementation if external module doesn't exist
  try {
    const { downloadResumeAsPDF: externalDownload } = await import('../../utils/pdfGenerator');
    return externalDownload(data, template);
  } catch {
    // Fallback: Use browser print
    return new Promise((resolve, reject) => {
      try {
        window.print();
        resolve();
      } catch (err) {
        reject(new Error('PDF generation failed'));
      }
    });
  }
};

const getFullscreenElement = () => {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const ResumePreview = ({ data, template }) => {
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [renderError, setRenderError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const isEmpty = !data || Object.keys(data).length === 0;

  // ── Fullscreen Monitoring ─────────────────────────────────────────────

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!getFullscreenElement());
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  // ── Auto-hide Controls in Fullscreen ─────────────────────────────────

  useEffect(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), CONTROLS_HIDE_DELAY);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  // ── Mouse Activity ───────────────────────────────────────────────────

  const handleMouseMove = useCallback(() => {
    if (!isFullscreen) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), CONTROLS_HIDE_DELAY);
  }, [isFullscreen]);

  // ── Template Loading ─────────────────────────────────────────────────

  useEffect(() => {
    setIsLoaded(false);
    setRenderError(null);
    const timer = setTimeout(() => { setIsLoaded(true); setPreviewKey(p => p + 1); }, 100);
    return () => clearTimeout(timer);
  }, [data, template]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (isEmpty) { toast.error('No content to download'); return; }
    setIsDownloading(true);
    try {
      const loadingToast = toast.loading('Generating PDF...');
      await downloadResumeAsPDF(data, template);
      toast.dismiss(loadingToast);
      toast.success('Resume downloaded!', { icon: '📄' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(error.message || 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  }, [isEmpty, data, template]);

  const handlePrint = useCallback(() => {
    if (isEmpty) { toast.error('No content to print'); return; }
    const content = previewRef.current?.innerHTML;
    if (!content) { toast.error('Preview not ready'); return; }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { toast.error('Please allow popups'); return; }

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Resume</title>
      <style>body{padding:40px;font-family:Arial,sans-serif;color:#333;}@media print{body{padding:0;}}</style>
      </head><body><div style="text-align:right;margin-bottom:20px;">
      <button onclick="window.print()" style="padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print</button>
      </div>${content}</body></html>`);
    printWindow.document.close();
  }, [isEmpty]);

  const handleFullscreen = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      if (!getFullscreenElement()) {
        await previewRef.current.requestFullscreen();
        toast.success('Press ESC to exit', { duration: 2000 });
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error('Fullscreen not supported');
    }
  }, []);

  const handleZoomIn = useCallback(() => setZoomLevel(p => Math.min(p + ZOOM_STEP, ZOOM_MAX)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(p => Math.max(p - ZOOM_STEP, ZOOM_MIN)), []);
  const handleZoomReset = useCallback(() => setZoomLevel(100), []);

  const handleShare = useCallback(async () => {
    if (isEmpty) { toast.error('No content to share'); return; }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Resume', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast.error('Failed to share');
    }
  }, [isEmpty]);

  const handleRetry = useCallback(() => {
    setRenderError(null);
    setPreviewKey(p => p + 1);
  }, []);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); handleDownload(); }
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); handleFullscreen(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); handleZoomReset(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); handleZoomIn(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); handleZoomOut(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDownload, handleFullscreen, handleZoomIn, handleZoomOut, handleZoomReset]);

  // ── Render Template ──────────────────────────────────────────────────

  const renderTemplate = useCallback(() => {
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <FiAlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Content Yet</h3>
          <p className="text-sm text-gray-500 max-w-md">Start adding your information to see a preview.</p>
        </div>
      );
    }

    try {
      // FIXED: Lazy load template components
      const TemplateComponent = React.lazy(() => {
        switch (template) {
          case 'classic': return import('./templates/Template2');
          case 'creative': return import('./templates/Template3');
          default: return import('./templates/Template1');
        }
      });

      return (
        <React.Suspense fallback={<div className="p-8 text-center"><FiLoader className="w-8 h-8 animate-spin mx-auto" /></div>}>
          <TemplateComponent key={previewKey} data={data} />
        </React.Suspense>
      );
    } catch (error) {
      console.error('Template error:', error);
      setRenderError(error);
      return null;
    }
  }, [isEmpty, template, previewKey, data]);

  // ── Zoom Controls Component ──────────────────────────────────────────

  const ZoomControls = useMemo(() => (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button onClick={handleZoomOut} disabled={zoomLevel <= ZOOM_MIN}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50" aria-label="Zoom out">
        <FiZoomOut className="w-4 h-4" />
      </button>
      <span className="text-xs font-medium min-w-[3rem] text-center">{zoomLevel}%</span>
      <button onClick={handleZoomIn} disabled={zoomLevel >= ZOOM_MAX}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50" aria-label="Zoom in">
        <FiZoomIn className="w-4 h-4" />
      </button>
      <button onClick={handleZoomReset} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ml-1" aria-label="Reset zoom">
        <FiRotateCcw className="w-4 h-4" />
      </button>
    </div>
  ), [zoomLevel, handleZoomIn, handleZoomOut, handleZoomReset]);

  return (
    <div className="space-y-3 sm:space-y-4" onMouseMove={handleMouseMove} onTouchStart={handleMouseMove}>
      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div className="flex flex-col sm:flex-row gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex gap-2 flex-1">
              <Button variant="outline" onClick={handleFullscreen} icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
                size="sm" className="flex-1 sm:flex-none text-xs">
                {isFullscreen ? 'Exit' : 'Full'}
              </Button>
              <Button onClick={handleDownload} loading={isDownloading} disabled={isEmpty}
                icon={<FiDownload />} size="sm" className="flex-1 sm:flex-none text-xs">
                {isDownloading ? '...' : 'PDF'}
              </Button>
              <div className="hidden sm:flex gap-2">
                <Button variant="outline" onClick={handlePrint} disabled={isEmpty} icon={<FiPrinter />} size="sm" className="text-xs">Print</Button>
                <Button variant="outline" onClick={handleShare} disabled={isEmpty} icon={<FiShare2 />} size="sm" className="text-xs">Share</Button>
              </div>
            </div>
            <div className="hidden sm:flex">{ZoomControls}</div>
            {!isEmpty && !renderError && isLoaded && (
              <div className="hidden lg:flex items-center gap-1 px-2 text-xs text-green-500"><FiCheck className="w-3 h-3" />Ready</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <div ref={containerRef} className={`relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
        style={{ transform: !isFullscreen ? `scale(${zoomLevel / 100})` : 'none', transformOrigin: 'top center' }}>
        
        {!isLoaded && !isEmpty && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-10">
            <FiLoader className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        <div ref={previewRef} className={isFullscreen ? 'h-screen overflow-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-950' : ''}
          style={{ maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 200px)', overflowY: 'auto' }}>
          <div className={isFullscreen ? 'max-w-5xl mx-auto my-8 shadow-2xl' : ''}>
            {renderError ? (
              <div className="p-8 text-center">
                <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
                <p className="text-sm text-gray-500 mb-4">Failed to render template.</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>Try Again</Button>
              </div>
            ) : renderTemplate()}
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="sm:hidden flex items-center justify-center gap-2 mt-2">
        {ZoomControls}
        <button onClick={handlePrint} disabled={isEmpty} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50" aria-label="Print"><FiPrinter className="w-4 h-4" /></button>
        <button onClick={handleShare} disabled={isEmpty} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50" aria-label="Share"><FiShare2 className="w-4 h-4" /></button>
      </div>

      {/* Fullscreen Hints */}
      <AnimatePresence>
        {isFullscreen && showControls && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 glass-card px-3 py-1.5 text-xs text-gray-500 z-50 hidden lg:block">
            F: Fullscreen • ⌘P: Download • ⌘0: Reset • ESC: Exit
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// FIXED: Simpler memo comparison without JSON.stringify
export default React.memo(ResumePreview, (prev, next) => {
  return prev.data === next.data && prev.template === next.template;
});
