import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiDownload, FiEdit3, FiArrowLeft, FiShare2,
  FiMaximize2, FiMinimize2, FiPrinter, FiCopy,
  FiCheck, FiLoader, FiAlertCircle,
} from 'react-icons/fi';
import { useResume } from '../contexts/ResumeContext';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import ResumePreview from '../components/resume/ResumePreview';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Safe PDF generation ─────────────────────────────────────────────────

const generatePDFSafe = async (data, template) => {
  try {
    const { generatePDF } = await import('../utils/pdfGenerator');
    await generatePDF(data, template);
  } catch {
    window.print();
  }
};

// ── Component ─────────────────────────────────────────────────────────────

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getResume } = useResume();
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mountedRef = useRef(true);

  // Set page title
  usePageTitle({
    title: resume ? `Preview: ${resume.name || 'Resume'}` : 'Resume Preview',
    description: 'Preview your professional resume before downloading.',
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Load resume ─────────────────────────────────────────────────────

  useEffect(() => {
    const loadResume = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await getResume(id);
        if (mountedRef.current) {
          if (data) {
            setResume(data);
          } else {
            setError('Resume not found');
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError('Failed to load resume');
          console.error('Error loading resume:', err);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadResume();
  }, [id, getResume]);

  // ── Fullscreen listener ─────────────────────────────────────────────

  useEffect(() => {
    const handleChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleDownload = useCallback(async () => {
    if (!resume) return;
    setDownloading(true);
    try {
      await generatePDFSafe(resume.data, resume.template);
      if (mountedRef.current) toast.success('Resume downloaded!');
    } catch {
      if (mountedRef.current) toast.error('Failed to download');
    } finally {
      if (mountedRef.current) setDownloading(false);
    }
  }, [resume]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/preview/${id}`;
    
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ title: resume?.name || 'Resume', url });
        return;
      } catch {}
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => { if (mountedRef.current) setCopied(false); }, 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [id, resume]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error('Fullscreen not supported');
    }
  }, []);

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FiLoader className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  // ── Error / Not Found State ──────────────────────────────────────────

  if (error || !resume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Resume Not Found'}
          </h2>
          <p className="text-gray-500 mb-6">
            The resume you're looking for doesn't exist or you don't have access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleGoBack} variant="outline" icon={<FiArrowLeft />}>
              Go Back
            </Button>
            <Button onClick={() => navigate('/dashboard')} icon={<FiDownload />}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header Toolbar */}
      <div className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Tooltip content="Back">
                <button onClick={handleGoBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              </Tooltip>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {resume.name || 'Resume Preview'}
                </h1>
                <p className="text-xs text-gray-500">{resume.template || 'modern'} template</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content="Edit Resume">
                <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${id}`)} icon={<FiEdit3 />}>
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Tooltip>
              <Tooltip content={copied ? 'Copied!' : 'Share Link'}>
                <Button variant="outline" size="sm" onClick={handleShare} icon={copied ? <FiCheck /> : <FiShare2 />}>
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </Tooltip>
              <Tooltip content="Print">
                <Button variant="outline" size="sm" onClick={handlePrint} icon={<FiPrinter />}>
                  <span className="hidden sm:inline">Print</span>
                </Button>
              </Tooltip>
              <Tooltip content={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} icon={fullscreen ? <FiMinimize2 /> : <FiMaximize2 />} />
              </Tooltip>
              <Tooltip content="Download PDF">
                <Button size="sm" onClick={handleDownload} loading={downloading} icon={<FiDownload />} className="bg-gradient-to-r from-primary-500 to-accent-500">
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <ResumePreview data={resume.data} template={resume.template} />
        </motion.div>
      </div>

      {/* Mobile Download Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-gray-200 dark:border-gray-700 sm:hidden print:hidden z-30">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${id}`)} className="flex-1">
            Edit
          </Button>
          <Button size="sm" onClick={handleDownload} loading={downloading} className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Preview;
