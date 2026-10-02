import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiDownload,
  FiEdit3,
  FiArrowLeft,
  FiShare2,
  FiPrinter,
  FiCheck,
  FiLoader,
  FiAlertCircle,
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
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mountedRef = useRef(true);

  usePageTitle({
    title: resume ? `Preview: ${resume.name || 'Resume'}` : 'Resume Preview',
    description: 'Preview your professional resume before downloading.',
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
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

  // ── Copy page link ──────────────────────────────────────────────────
  //
  // This button copies the current page URL. The `/preview/:id` route is
  // behind `PrivateRoute`, so the URL is only useful to the signed-in
  // owner of this resume — a recipient without that user's session will
  // be redirected to `/login`. This is why the button is labelled
  // "Copy Link" rather than "Share": the previous label and use of
  // `navigator.share` implied the URL was publicly shareable.
  //
  // Only the toast confirms the copy. The tooltip is not swapped to
  // "Copied!" — that produced two simultaneous feedbacks for one action.
  // The icon swap (`FiShare2` → `FiCheck`) remains as ambient feedback.
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/preview/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Page link copied!');
      setTimeout(() => {
        if (mountedRef.current) setCopied(false);
      }, 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [id]);

  // ── Reusable Back button ────────────────────────────────────────────
  //
  // Shared by the header toolbar, the loading shell, and the error shell
  // so all three keep identical styling and behaviour.
  const BackButton = () => (
    <Tooltip content="Back">
      <button
        onClick={handleGoBack}
        className="flex-shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Go back"
      >
        <FiArrowLeft className="w-5 h-5" />
      </button>
    </Tooltip>
  );

  // ── Loading State ────────────────────────────────────────────────────
  //
  // Previously rendered a bare centered spinner with no navigation — a
  // hung load left the user stuck. The shell below shows a Back button
  // so there is always an escape route.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <BackButton />
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FiLoader className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading preview...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / Not Found State ──────────────────────────────────────────
  //
  // Same shell pattern as the loading state.

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center">
            <BackButton />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error || 'Resume Not Found'}
            </h2>
            <p className="text-gray-500 mb-6">
              The resume you're looking for doesn't exist or you don't have access.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={handleGoBack} variant="outline" icon={<FiArrowLeft />}>
                Go Back
              </Button>
              <Button onClick={() => navigate('/dashboard')} icon={<FiDownload />}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header Toolbar */}
      <div className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-2">
            {/*
              Left section: `min-w-0 flex-1` lets it shrink below the
              intrinsic width of the title. Without it, a long resume
              name pushed the right group of buttons off the viewport.
              The title div also carries `min-w-0 flex-1` so the two
              `truncate` classes below can take effect.
            */}
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
              <BackButton />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
                  {resume.name || 'Resume Preview'}
                </h1>
                <p className="truncate text-xs text-gray-500">
                  {resume.template || 'modern'} template
                </p>
              </div>
            </div>

            {/*
              Right section: `flex-shrink-0` prevents the buttons from
              being squeezed by the truncating title on the left.

              `gap-1 sm:gap-2` tightens the gaps on mobile to buy a few
              more pixels of space.

              The Print button is wrapped in `hidden sm:inline-flex` so it
              disappears entirely below 640 px — matching the pattern used
              by the DashboardLayout header, where the least-used control
              yields its space first.
            */}
            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <Tooltip content="Edit Resume">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/builder/${id}`)}
                  icon={<FiEdit3 />}
                >
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Tooltip>
              <Tooltip content="Copy page link">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  icon={copied ? <FiCheck /> : <FiShare2 />}
                >
                  <span className="hidden sm:inline">Copy Link</span>
                </Button>
              </Tooltip>
              <div className="hidden sm:inline-flex">
                <Tooltip content="Print">
                  <Button variant="outline" size="sm" onClick={handlePrint} icon={<FiPrinter />}>
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                </Tooltip>
              </div>
              <Tooltip content="Download PDF">
                <Button
                  size="sm"
                  onClick={handleDownload}
                  loading={downloading}
                  icon={<FiDownload />}
                  className="bg-gradient-to-r from-primary-500 to-accent-500"
                >
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
    </div>
  );
};

export default Preview;
