import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  FiDownload, 
  FiMaximize, 
  FiMinimize, 
  FiLoader, 
  FiZoomIn, 
  FiZoomOut,
  FiRotateCcw,
  FiAlertCircle,
  FiCheck,
  FiPrinter,
  FiShare2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';
import { downloadResumeAsPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const ResumePreview = ({ data, template }) => {
  const previewRef = useRef();
  const containerRef = useRef();
  const controlsTimeoutRef = useRef();
  
  // State management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [renderError, setRenderError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [previewKey, setPreviewKey] = useState(0); // Force re-render when needed

  // Check if data is empty
  const isEmpty = !data || Object.keys(data).length === 0;

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement ||
                                document.msFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls in fullscreen mode
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // Handle mouse movement in fullscreen
  const handleMouseMove = useCallback(() => {
    if (isFullscreen) {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isFullscreen]);

  // Handle PDF download
  const handleDownload = async () => {
    if (isEmpty) {
      toast.error('No content to download. Please add information to your resume.');
      return;
    }

    setIsDownloading(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF...');
      
      await downloadResumeAsPDF(data, template);
      
      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Resume downloaded successfully!', {
        icon: '📄',
        duration: 4000
      });
    } catch (error) {
      console.error('Download failed:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to download resume';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Download timed out. Please try again.';
      } else if (error.message?.includes('memory')) {
        errorMessage = 'Resume is too large. Try removing some content.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle print
  const handlePrint = useCallback(() => {
    if (isEmpty) {
      toast.error('No content to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }

    const previewContent = previewRef.current?.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume Preview</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { 
              padding: 20px;
              background: white;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
              Print Resume
            </button>
          </div>
          ${previewContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
  }, [isEmpty]);

  // Handle fullscreen toggle
  const handleFullscreen = async () => {
    try {
      if (!previewRef.current) return;

      if (!document.fullscreenElement) {
        await previewRef.current.requestFullscreen();
        toast.success('Press ESC to exit fullscreen', {
          duration: 2000,
          icon: '🖥️'
        });
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen mode is not supported in your browser');
    }
  };

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  // Handle share
  const handleShare = async () => {
    if (isEmpty) {
      toast.error('No content to share');
      return;
    }

    try {
      const shareData = {
        title: 'My Professional Resume',
        text: 'Check out my professional resume created with ATS Resume Builder!',
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback - copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share');
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + P for print/PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleDownload();
      }
      // F key for fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleFullscreen();
      }
      // Ctrl/Cmd + 0 for zoom reset
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
      // Ctrl/Cmd + Plus for zoom in
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl/Cmd + Minus for zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownload, handleFullscreen, handleZoomIn, handleZoomOut, handleZoomReset]);

  // Force template re-render when data changes significantly
  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setPreviewKey(prev => prev + 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [data, template]);

  // Render template with error boundary
  const renderTemplate = () => {
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-4">
            <FiAlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Content Yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            Start adding your personal information, experience, and skills to see a preview of your resume here.
          </p>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-md">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 Tip: Complete at least the Personal Info and Experience sections for the best results.
            </p>
          </div>
        </div>
      );
    }

    try {
      const templateProps = { data, key: previewKey };
      
      switch (template) {
        case 'modern':
          return <Template1 {...templateProps} />;
        case 'classic':
          return <Template2 {...templateProps} />;
        case 'creative':
          return <Template3 {...templateProps} />;
        default:
          return <Template1 {...templateProps} />;
      }
    } catch (error) {
      console.error('Template render error:', error);
      setRenderError(error);
      return (
        <div className="p-8 text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Preview Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            There was an error rendering this template.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRenderError(null);
                setPreviewKey(prev => prev + 1);
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className="space-y-3 sm:space-y-4" 
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Controls Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            className="flex flex-col sm:flex-row gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Main Actions */}
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={handleFullscreen}
                icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
                title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Fullscreen (F)'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                <span className="hidden sm:inline">
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </span>
                <span className="sm:hidden">
                  {isFullscreen ? 'Exit' : 'Full'}
                </span>
              </Button>
              
              <Button
                onClick={handleDownload}
                loading={isDownloading}
                disabled={isEmpty || isDownloading}
                icon={isDownloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
                title="Download PDF (Ctrl/Cmd + P)"
                aria-label="Download resume as PDF"
              >
                <span className="hidden sm:inline">
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </span>
                <span className="sm:hidden">
                  {isDownloading ? '...' : 'PDF'}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={isEmpty}
                icon={<FiPrinter />}
                size="sm"
                className="hidden sm:flex sm:flex-none text-xs sm:text-sm"
                title="Print Resume"
                aria-label="Print resume"
              >
                <span className="hidden sm:inline">Print</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                disabled={isEmpty}
                icon={<FiShare2 />}
                size="sm"
                className="hidden sm:flex sm:flex-none text-xs sm:text-sm"
                title="Share Resume"
                aria-label="Share resume"
              >
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>

            {/* Zoom Controls - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out (Ctrl/Cmd + -)"
                aria-label="Zoom out"
              >
                <FiZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-medium min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In (Ctrl/Cmd + +)"
                aria-label="Zoom in"
              >
                <FiZoomIn className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-1"
                title="Reset Zoom (Ctrl/Cmd + 0)"
                aria-label="Reset zoom"
              >
                <FiRotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status */}
            {!isEmpty && !renderError && isLoaded && (
              <div className="hidden lg:flex items-center gap-1 px-2 text-xs text-green-500">
                <FiCheck className="w-3 h-3" />
                <span>Preview Ready</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className={`
          relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden
          transition-all duration-300
          ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}
        `}
        style={{
          transform: !isFullscreen ? `scale(${zoomLevel / 100})` : 'none',
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out'
        }}
      >
        {/* Loading Overlay */}
        {!isLoaded && !isEmpty && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <FiLoader className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div
          ref={previewRef}
          className={`
            transition-all duration-300
            ${isFullscreen ? 'h-screen overflow-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-950' : ''}
          `}
          style={{
            maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
            overflowY: isFullscreen ? 'auto' : 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Template Wrapper */}
          <div className={`
            ${isFullscreen ? 'max-w-5xl mx-auto my-8 shadow-2xl' : ''}
            ${!isFullscreen && zoomLevel !== 100 ? 'origin-top' : ''}
          `}>
            {renderTemplate()}
          </div>

          {/* Footer Hint in Fullscreen */}
          {!isEmpty && isFullscreen && (
            <div className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4 pb-4">
              Press ESC to exit fullscreen • Use mouse wheel to scroll • Move mouse to show controls
            </div>
          )}
        </div>

        {/* Fullscreen Hint Overlay */}
        {isFullscreen && !showControls && (
          <motion.div 
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 glass-card px-4 py-2 text-xs text-gray-600 dark:text-gray-400 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            Move mouse to show controls
          </motion.div>
        )}

        {/* Render Error Fallback */}
        {renderError && (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Preview Error
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              There was an error rendering this template. This might be due to invalid data.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRenderError(null);
                  setPreviewKey(prev => prev + 1);
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Zoom Controls */}
      <div className="sm:hidden flex items-center justify-center gap-2 mt-2">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 50}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
          aria-label="Zoom out"
        >
          <FiZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium min-w-[3rem] text-center">
          {zoomLevel}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 200}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
          aria-label="Zoom in"
        >
          <FiZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomReset}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg active:bg-gray-200 dark:active:bg-gray-700"
          aria-label="Reset zoom"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
        
        {/* Mobile Print Button */}
        <button
          onClick={handlePrint}
          disabled={isEmpty}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
          aria-label="Print"
        >
          <FiPrinter className="w-4 h-4" />
        </button>
        
        {/* Mobile Share Button */}
        <button
          onClick={handleShare}
          disabled={isEmpty}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-50 active:bg-gray-200 dark:active:bg-gray-700"
          aria-label="Share"
        >
          <FiShare2 className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Helper */}
      <AnimatePresence>
        {isFullscreen && showControls && (
          <motion.div 
            className="fixed top-4 right-4 glass-card px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 z-50 hidden lg:block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span className="mr-3">F: Fullscreen</span>
            <span className="mr-3">⌘/Ctrl+P: Download</span>
            <span className="mr-3">⌘/Ctrl+0: Reset Zoom</span>
            <span>ESC: Exit</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(ResumePreview, (prevProps, nextProps) => {
  // Custom comparison for better performance
  const dataEqual = JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  const templateEqual = prevProps.template === nextProps.template;
  
  return dataEqual && templateEqual;
});