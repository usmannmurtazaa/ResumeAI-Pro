import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiArrowRight, FiPlus, FiEdit3, FiTrash2,
  FiCopy, FiDownload, FiEye, FiSave, FiTarget, FiZap,
  FiBriefcase, FiUser, FiMail, FiPhone, FiMapPin,
  FiCalendar, FiClock, FiCheckCircle, FiAlertCircle,
  FiInfo, FiStar, FiAward, FiLayout, FiRefreshCw,
  FiChevronRight, FiChevronDown, FiChevronUp, FiX,
  FiLoader, FiExternalLink,
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import Progress from '../components/ui/Progress';
import { useAuth } from '../contexts/AuthContext';
import { useResume } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';

// ============================================
// COVER LETTER PAGE COMPONENT
// ============================================

const CoverLetter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resumes } = useResume();
  
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    company: '',
    hiringManager: '',
    content: '',
    template: 'professional',
    resumeId: '',
  });
  const [saving, setSaving] = useState(false);

  // Load cover letters (simulated)
  useEffect(() => {
    const loadCoverLetters = () => {
      const saved = localStorage.getItem(`coverLetters_${user?.uid}`);
      if (saved) {
        setCoverLetters(JSON.parse(saved));
      } else {
        // Sample cover letter
        const sample = {
          id: '1',
          name: 'Sample Cover Letter',
          jobTitle: 'Software Engineer',
          company: 'Tech Company',
          hiringManager: 'Hiring Manager',
          content: `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at Tech Company. With my background in full-stack development and passion for creating innovative solutions, I am confident in my ability to contribute to your team.

Throughout my career, I have developed expertise in React, Node.js, and cloud technologies. I have successfully delivered multiple projects that improved user experience and operational efficiency.

I am particularly drawn to Tech Company's mission of transforming the industry through technology. I would welcome the opportunity to discuss how my skills and experience align with your needs.

Thank you for your time and consideration.

Sincerely,
[Your Name]`,
          template: 'professional',
          resumeId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCoverLetters([sample]);
        localStorage.setItem(`coverLetters_${user?.uid}`, JSON.stringify([sample]));
      }
      setLoading(false);
    };

    if (user) {
      loadCoverLetters();
    }
  }, [user]);

  // Save to localStorage
  const saveCoverLetters = (letters) => {
    setCoverLetters(letters);
    localStorage.setItem(`coverLetters_${user?.uid}`, JSON.stringify(letters));
  };

  // Create new cover letter
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.jobTitle.trim() || !formData.company.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const newLetter = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [...coverLetters, newLetter];
      saveCoverLetters(updated);
      
      toast.success('Cover letter created!');
      setShowCreateModal(false);
      setSelectedLetter(newLetter);
      resetForm();
    } catch (error) {
      toast.error('Failed to create cover letter');
    } finally {
      setSaving(false);
    }
  };

  // Update cover letter
  const handleUpdate = async () => {
    if (!selectedLetter) return;

    setSaving(true);
    try {
      const updated = coverLetters.map(l => 
        l.id === selectedLetter.id 
          ? { ...l, ...formData, updatedAt: new Date().toISOString() }
          : l
      );
      saveCoverLetters(updated);
      setSelectedLetter({ ...selectedLetter, ...formData });
      toast.success('Cover letter updated!');
    } catch (error) {
      toast.error('Failed to update cover letter');
    } finally {
      setSaving(false);
    }
  };

  // Delete cover letter
  const handleDelete = (id) => {
    const updated = coverLetters.filter(l => l.id !== id);
    saveCoverLetters(updated);
    if (selectedLetter?.id === id) {
      setSelectedLetter(null);
    }
    toast.success('Cover letter deleted');
  };

  // Duplicate cover letter
  const handleDuplicate = (letter) => {
    const duplicated = {
      ...letter,
      id: Date.now().toString(),
      name: `${letter.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...coverLetters, duplicated];
    saveCoverLetters(updated);
    toast.success('Cover letter duplicated');
  };

  // Download as TXT
  const handleDownload = (letter) => {
    const content = generateFullLetter(letter);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Cover letter downloaded!');
  };

  // Generate full letter with user info
  const generateFullLetter = (letter) => {
    const resume = resumes.find(r => r.id === letter.resumeId);
    const personal = resume?.data?.personal || {};
    
    let content = letter.content;
    
    // Replace placeholders
    content = content.replace(/\[Your Name\]/g, personal.fullName || 'Your Name');
    content = content.replace(/\[Job Title\]/g, letter.jobTitle);
    content = content.replace(/\[Company\]/g, letter.company);
    content = content.replace(/\[Hiring Manager\]/g, letter.hiringManager || 'Hiring Manager');
    
    // Add contact info header
    const header = `${personal.fullName || 'Your Name'}
${personal.email || ''} | ${personal.phone || ''} | ${personal.location || ''}
${new Date().toLocaleDateString()}

${letter.hiringManager ? `${letter.hiringManager}\n` : ''}${letter.company}

Re: Application for ${letter.jobTitle}

`;
    
    return header + content;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      jobTitle: '',
      company: '',
      hiringManager: '',
      content: '',
      template: 'professional',
      resumeId: '',
    });
  };

  const openEditor = (letter) => {
    setSelectedLetter(letter);
    setFormData({
      name: letter.name,
      jobTitle: letter.jobTitle,
      company: letter.company,
      hiringManager: letter.hiringManager || '',
      content: letter.content,
      template: letter.template,
      resumeId: letter.resumeId || '',
    });
  };

  const templates = [
    { id: 'professional', name: 'Professional', icon: '📄', color: 'from-blue-500 to-cyan-500' },
    { id: 'modern', name: 'Modern', icon: '🎨', color: 'from-purple-500 to-pink-500' },
    { id: 'executive', name: 'Executive', icon: '👔', color: 'from-slate-700 to-slate-900' },
    { id: 'creative', name: 'Creative', icon: '✨', color: 'from-orange-500 to-red-500' },
  ];

  // Template content generators
  const generateTemplateContent = (template, jobTitle, company) => {
    const templates = {
      professional: `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With my proven track record of success and dedication to excellence, I am confident in my ability to make a significant contribution to your team.

Throughout my career, I have developed expertise in [key skills]. I have successfully [key achievement] that resulted in [measurable outcome].

I am particularly drawn to ${company}'s reputation for [company strength]. I am eager to bring my skills and experience to help drive continued success.

Thank you for considering my application. I look forward to discussing how I can contribute to ${company}.

Sincerely,
[Your Name]`,
      modern: `Hi there,

I'm excited to apply for the ${jobTitle} role at ${company}! 

After researching ${company} and your innovative work in [industry], I knew I had to reach out. My background in [field] and passion for [relevant interest] make me a great fit for this position.

Some highlights of what I bring:
• [Key achievement 1]
• [Key achievement 2]
• [Key achievement 3]

I'd love to chat about how I can help ${company} continue to grow and innovate.

Best,
[Your Name]`,
      executive: `Dear ${formData.hiringManager || 'Hiring Committee'},

I am writing to present my credentials for the ${jobTitle} position at ${company}. As a senior leader with extensive experience driving organizational growth and operational excellence, I am well-positioned to deliver immediate value to your executive team.

My career has been defined by a consistent ability to:
- Develop and execute strategic initiatives that drive revenue growth
- Build and mentor high-performing teams
- Optimize operations for maximum efficiency

I am impressed by ${company}'s market position and growth trajectory. I would welcome the opportunity to discuss how my leadership experience aligns with your strategic objectives.

I look forward to our conversation.

Respectfully,
[Your Name]`,
    };
    return templates[template] || templates.professional;
  };

  const applyTemplate = (templateId) => {
    setFormData(prev => ({
      ...prev,
      template: templateId,
      content: generateTemplateContent(templateId, prev.jobTitle, prev.company),
    }));
    setShowTemplateModal(false);
    toast.success(`${templateId} template applied!`);
  };

  if (loading) {
    return (
      <DashboardLayout title="Cover Letter Builder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <FiLoader className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cover Letter Builder" description="Create professional cover letters that complement your resume">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Cover Letters</h1>
            <p className="text-gray-500 dark:text-gray-400">Create and manage your cover letters</p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }} icon={<FiPlus />}>
            New Cover Letter
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cover Letter List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Your Cover Letters</h3>
            
            {coverLetters.length === 0 ? (
              <Card className="p-8 text-center">
                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No cover letters yet</p>
                <Button size="sm" variant="outline" onClick={() => setShowCreateModal(true)} className="mt-3">
                  Create One
                </Button>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {coverLetters.map((letter) => (
                  <motion.div
                    key={letter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedLetter?.id === letter.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                    onClick={() => openEditor(letter)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{letter.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{letter.jobTitle} at {letter.company}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(letter.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Tooltip content="Download">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(letter); }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Duplicate">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(letter); }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(letter.id); }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {selectedLetter ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Edit Cover Letter</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{selectedLetter.template}</Badge>
                      <Tooltip content="Preview">
                        <button
                          onClick={() => {
                            const content = generateFullLetter({ ...selectedLetter, ...formData });
                            const win = window.open('', '_blank');
                            win.document.write(`<pre style="font-family: Arial; padding: 20px; white-space: pre-wrap;">${content}</pre>`);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Download">
                        <button
                          onClick={() => handleDownload({ ...selectedLetter, ...formData })}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Cover Letter Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Google Application"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Link to Resume (Optional)</label>
                      <select
                        value={formData.resumeId}
                        onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })}
                        className="input-field"
                      >
                        <option value="">None</option>
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>{r.name || 'Untitled'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Job Title"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g., Software Engineer"
                      icon={<FiBriefcase />}
                    />
                    <Input
                      label="Company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g., Google"
                      icon={<FiTarget />}
                    />
                  </div>

                  <Input
                    label="Hiring Manager (Optional)"
                    value={formData.hiringManager}
                    onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                    placeholder="e.g., Jane Smith"
                    icon={<FiUser />}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Content</label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowTemplateModal(true)}
                        icon={<FiLayout />}
                      >
                        Templates
                      </Button>
                    </div>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={12}
                      className="input-field resize-none font-mono text-sm"
                      placeholder="Write your cover letter content..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setSelectedLetter(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} loading={saving} icon={<FiSave />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cover Letter Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a cover letter from the list or create a new one
                </p>
                <Button onClick={() => setShowCreateModal(true)} icon={<FiPlus />}>
                  Create New
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="p-5 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FiZap className="w-5 h-5 text-yellow-500" />
            Cover Letter Tips
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <TipCard icon={FiTarget} title="Customize Each Letter" description="Tailor your cover letter to each specific job and company" />
            <TipCard icon={FiStar} title="Show Your Value" description="Highlight specific achievements and quantify your impact" />
            <TipCard icon={FiFileText} title="Keep it Concise" description="Aim for 3-4 paragraphs and keep it under one page" />
          </div>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Cover Letter" size="lg">
        <div className="space-y-4">
          <Input
            label="Cover Letter Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Google Application"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Job Title"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g., Software Engineer"
              required
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g., Google"
              required
            />
          </div>
          <Input
            label="Hiring Manager (Optional)"
            value={formData.hiringManager}
            onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
            placeholder="e.g., Jane Smith"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Template</label>
            <div className="grid grid-cols-4 gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setFormData({ ...formData, template: t.id })}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    formData.template === t.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <p className="text-xs font-medium mt-1">{t.name}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Choose Template" size="md">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Select a template to replace your current content</p>
          <div className="grid grid-cols-2 gap-3">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 transition-all text-left"
              >
                <span className="text-2xl">{t.icon}</span>
                <p className="font-medium mt-2">{t.name}</p>
                <p className="text-xs text-gray-500">Professional format</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// Tip Card Component
const TipCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
      <Icon className="w-4 h-4 text-blue-500" />
    </div>
    <div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

export default CoverLetter;