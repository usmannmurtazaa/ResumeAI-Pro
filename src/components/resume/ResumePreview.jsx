import React, { useRef } from 'react';
import { FiDownload, FiMaximize } from 'react-icons/fi';
import Button from '../ui/Button';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';
import { downloadResumeAsPDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const ResumePreview = ({ data, template }) => {
  const previewRef = useRef();

  const handleDownload = async () => {
    try {
      await downloadResumeAsPDF(data, template);
      toast.success('Resume downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download resume');
    }
  };

  const handleFullscreen = () => {
    if (previewRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        previewRef.current.requestFullscreen();
      }
    }
  };

  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <Template1 data={data} />;
      case 'classic':
        return <Template2 data={data} />;
      case 'creative':
        return <Template3 data={data} />;
      default:
        return <Template1 data={data} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleFullscreen}
          icon={<FiMaximize />}
        >
          Fullscreen
        </Button>
        <Button
          onClick={handleDownload}
          icon={<FiDownload />}
        >
          Download PDF
        </Button>
      </div>

      <div
        ref={previewRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden"
      >
        {renderTemplate()}
      </div>
    </div>
  );
};

export default ResumePreview;