import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResume } from '../../hooks/useResume';
import { useDebounce } from '../../hooks/useDebounce';
import PersonalInfo from './sections/PersonalInfo';
import Education from './sections/Education';
import Experience from './sections/Experience';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Certifications from './sections/Certifications';
import ResumePreview from './ResumePreview';
import TemplateSelector from './TemplateSelector';
import { calculateATSScore } from '../../utils/atsKeywords';
import { FiSave, FiEye, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import Button from '../ui/Button';

const sections = [
  { id: 'personal', name: 'Personal Info', component: PersonalInfo },
  { id: 'education', name: 'Education', component: Education },
  { id: 'experience', name: 'Experience', component: Experience },
  { id: 'skills', name: 'Skills', component: Skills },
  { id: 'projects', name: 'Projects', component: Projects },
  { id: 'certifications', name: 'Certifications', component: Certifications },
];

const ResumeBuilder = () => {
  const { id } = useParams();
  const { resume, saveResume, loading } = useResume(id);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(false);
  const [atsScore, setAtsScore] = useState(0);
  
  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    if (resume) {
      setFormData(resume.data || {});
      setSelectedTemplate(resume.template || 'modern');
    }
  }, [resume]);

  const handleAutoSave = useCallback(async () => {
    if (Object.keys(formData).length === 0) return;
    
    try {
      await saveResume({
        data: formData,
        template: selectedTemplate,
        lastModified: new Date().toISOString(),
        atsScore
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [formData, selectedTemplate, atsScore, saveResume]);

  useEffect(() => {
    if (Object.keys(debouncedFormData).length > 0) {
      handleAutoSave();
      const score = calculateATSScore(debouncedFormData);
      setAtsScore(score);
    }
  }, [debouncedFormData, handleAutoSave]);

  const handleSectionChange = (sectionData) => {
    setFormData(prev => ({
      ...prev,
      [sections[currentSection].id]: sectionData
    }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const CurrentSectionComponent = sections[currentSection].component;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="glass-card mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {id ? 'Edit Resume' : 'Create New Resume'}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentSection + 1}/{sections.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">ATS Score:</span>
                  <span className={`text-sm font-bold ${
                    atsScore >= 80 ? 'text-green-500' :
                    atsScore >= 60 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {atsScore}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                icon={<FiEye />}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button
                onClick={handleAutoSave}
                loading={loading}
                icon={<FiSave />}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(index)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentSection === index
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
          {/* Form Section */}
          <motion.div layout className="glass-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentSectionComponent
                  data={formData[sections[currentSection].id] || {}}
                  onChange={handleSectionChange}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
                icon={<FiChevronLeft />}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentSection === sections.length - 1}
                icon={<FiChevronRight />}
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </motion.div>

          {/* Preview Section */}
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card sticky top-24 h-[calc(100vh-8rem)] overflow-auto"
            >
              <ResumePreview
                data={formData}
                template={selectedTemplate}
              />
            </motion.div>
          )}
        </div>

        {/* Template Selector */}
        <div className="mt-8">
          <TemplateSelector
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;