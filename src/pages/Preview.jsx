import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiDownload, FiEdit3, FiArrowLeft, FiShare2,
  FiMaximize2, FiMinimize2, FiPrinter, FiCopy,
  FiCheck, FiLoader,
} from 'react-icons/fi';
import { useResume } from '../contexts/ResumeContext';
import Button from '../components/ui/Button';
import Tooltip from '../components/ui/Tooltip';
import ResumePreview from '../components/resume/ResumePreview';
import { generatePDF } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getResume } = useResume();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadResume = async () => {
      const data = await getResume(id);
      setResume(data);
      setLoading(false);
    };
    loadResume();
  }, [id, getResume]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePDF(resume.data, resume.template);
      toast.success('Resume downloaded!');
    } catch (error) {
      toast.error('Failed to download resume');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/preview/${id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Resume Not Found</h2>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
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
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              </Tooltip>
              <h1 className="text-xl font-semibold">{resume.name || 'Resume Preview'}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content="Edit">
                <Button variant="outline" size="sm" onClick={() => navigate(`/builder/${id}`)} icon={<FiEdit3 />}>
                  Edit
                </Button>
              </Tooltip>
              <Tooltip content={copied ? 'Copied!' : 'Share'}>
                <Button variant="outline" size="sm" onClick={handleShare} icon={copied ? <FiCheck /> : <FiShare2 />}>
                  Share
                </Button>
              </Tooltip>
              <Tooltip content="Print">
                <Button variant="outline" size="sm" onClick={handlePrint} icon={<FiPrinter />}>
                  Print
                </Button>
              </Tooltip>
              <Tooltip content={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} icon={fullscreen ? <FiMinimize2 /> : <FiMaximize2 />} />
              </Tooltip>
              <Tooltip content="Download PDF">
                <Button size="sm" onClick={handleDownload} loading={downloading} icon={<FiDownload />} className="bg-gradient-to-r from-primary-500 to-accent-500">
                  Download
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
          className="max-w-4xl mx-auto"
        >
          <ResumePreview data={resume.data} template={resume.template} />
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .container { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default Preview;