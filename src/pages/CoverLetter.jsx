import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiFileText, FiPlus, FiEdit3, FiTrash2,
  FiCopy, FiDownload, FiEye, FiSave,
  FiTarget, FiZap, FiBriefcase, FiUser,
  FiStar, FiLayout, FiChevronRight, FiX,
  FiLoader, FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import { useAuth } from '../hooks/useAuth';
import { useResume } from '../contexts/ResumeContext';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'professional', name: 'Professional', icon: '📄', color: 'from-blue-500 to-cyan-500' },
  { id: 'modern', name: 'Modern', icon: '🎨', color: 'from-purple-500 to-pink-500' },
  { id: 'executive', name: 'Executive', icon: '👔', color: 'from-slate-700 to-slate-900' },
  { id: 'creative', name: 'Creative', icon: '✨', color: 'from-orange-500 to-red-500' },
];

const INITIAL_FORM_DATA = {
  name: '',
  jobTitle: '',
  company: '',
  hiringManager: '',
  content: '',
  template: 'professional',
  resumeId: '',
};

const COVER_LETTER_TIPS = [
  { icon: FiTarget, title: 'Customize Each Letter', description: 'Tailor your cover letter to each specific job and company.' },
  { icon: FiStar, title: 'Show Your Value', description: 'Highlight specific achievements and quantify your impact.' },
  { icon: FiFileText, title: 'Keep it Concise', description: 'Aim for 3-4 paragraphs and keep it under one page.' },
];

// ── Template Content Generators ──────────────────────────────────────────

const generateTemplateContent = (template, jobTitle, company, hiringManager) => {
  const templates = {
    professional: `Dear ${hiringManager || 'Hiring Manager'},

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With my proven track record and dedication to excellence, I am confident in my ability to contribute to your team.

Throughout my career, I have developed expertise in [key skills]. I have successfully [key achievement] that resulted in [measurable outcome].

I am particularly drawn to ${company}'s reputation for innovation and excellence. I am eager to bring my skills to help drive continued success.

Thank you for considering my application. I look forward to discussing this opportunity.

Sincerely,
[Your Name]`,
    modern: `Hi ${hiringManager ? hiringManager.split(' ')[0] : 'there'},

I'm excited to apply for the ${jobTitle} role at ${company}! 

After researching ${company} and your work in [industry], I knew I had to reach out.

Some highlights:
• [Key achievement 1]
• [Key achievement 2]  
• [Key achievement 3]

I'd love to discuss how I can help ${company} grow.

Best,
[Your Name]`,
    executive: `Dear ${hiringManager || 'Hiring Committee'},

I am writing to present my credentials for the ${jobTitle} position at ${company}. As a seasoned leader with extensive experience driving growth, I am well-positioned to deliver value.

Key accomplishments include:
- [Strategic initiative with measurable result]
- [Team leadership achievement]
- [Operational improvement]

I look forward to discussing how my experience aligns with ${company}'s objectives.

Respectfully,
[Your Name]`,
  };
  return templates[template] || templates.professional;
};

// ── Sub-Components ────────────────────────────────────────────────────────

const TipCard = React.memo(({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
      <Icon className="w-4 h-4 text-blue-500" />
    </div>
    <div>
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  </div>
));

TipCard.displayName = 'TipCard';

// ── Main Component ────────────────────────────────────────────────────────

const CoverLetter = () => {
  const { user } = useAuth();
  const { resumes = [] } = useResume();

  usePageTitle({
    title: 'Cover Letter Builder',
    description: 'Create professional cover letters that complement your resume.',
  });

  const [coverLetters, setCoverLetters] = useState(() => {
    try {
      const saved = localStorage.getItem(`coverLetters_${user?.uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Load initial data ────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  // ── Save to localStorage ────────────────────────────────────────────

  const saveCoverLetters = useCallback((letters) => {
    setCoverLetters(letters);
    try {
      localStorage.setItem(`coverLetters_${user?.uid}`, JSON.stringify(letters));
    } catch {}
  }, [user]);

  // ── Generate full letter text ────────────────────────────────────────

  const generateFullLetter = useCallback((letter) => {
    const resume = resumes.find(r => r.id === letter.resumeId);
    const personal = resume?.data?.personal || {};

    let content = letter.content || '';
    content = content.replace(/\[Your Name\]/g, personal.fullName || 'Your Name');
    content = content.replace(/\[Job Title\]/g, letter.jobTitle);
    content = content.replace(/\[Company\]/g, letter.company);

    const header = [
      personal.fullName,
      [personal.email, personal.phone, personal.location].filter(Boolean).join(' | '),
      new Date().toLocaleDateString(),
      '',
      letter.hiringManager ? letter.hiringManager : '',
      letter.company,
      '',
      `Re: Application for ${letter.jobTitle}`,
      '',
    ].filter(line => line !== '').join('\n');

    return header + '\n' + content;
  }, [resumes]);

  // ── Validation ──────────────────────────────────────────────────────

  const validateForm = useCallback((data) => {
    const errs = {};
    if (!data.name.trim()) errs.name = 'Name is required';
    if (!data.jobTitle.trim()) errs.jobTitle = 'Job title is required';
    if (!data.company.trim()) errs.company = 'Company is required';
    if (!data.content.trim()) errs.content = 'Content is required';
    return errs;
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const handleCreate = useCallback(async () => {
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
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
      saveCoverLetters([...coverLetters, newLetter]);
      toast.success('Cover letter created!');
      setShowCreateModal(false);
      setSelectedLetter(newLetter);
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch {
      toast.error('Failed to create cover letter');
    } finally {
      setSaving(false);
    }
  }, [formData, coverLetters, saveCoverLetters, validateForm]);

  const handleUpdate = useCallback(async () => {
    if (!selectedLetter) return;

    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors');
      return;
    }

    setSaving(true);
    try {
      const updated = coverLetters.map(l =>
        l.id === selectedLetter.id
          ? { ...l, ...formData, updatedAt: new Date().toISOString() }
          : l
      );
      saveCoverLetters(updated);
      setSelectedLetter(prev => ({ ...prev, ...formData }));
      toast.success('Cover letter updated!');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  }, [selectedLetter, formData, coverLetters, saveCoverLetters, validateForm]);

  const handleDelete = useCallback((id) => {
    const updated = coverLetters.filter(l => l.id !== id);
    saveCoverLetters(updated);
    if (selectedLetter?.id === id) setSelectedLetter(null);
    toast.success('Deleted');
  }, [coverLetters, selectedLetter, saveCoverLetters]);

  const handleDuplicate = useCallback((letter) => {
    const dup = {
      ...letter,
      id: Date.now().toString(),
      name: `${letter.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCoverLetters([...coverLetters, dup]);
    toast.success('Duplicated');
  }, [coverLetters, saveCoverLetters]);

  const handleDownload = useCallback((letter) => {
    const content = generateFullLetter(letter);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }, [generateFullLetter]);

  const handlePreview = useCallback((letter) => {
    const content = generateFullLetter(letter);
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(`<pre style="font-family:Georgia,serif;font-size:14px;line-height:1.6;padding:40px;max-width:700px;margin:0 auto;white-space:pre-wrap;">${content.replace(/</g, '&lt;')}</pre>`);
      win.document.close();
    }
  }, [generateFullLetter]);

  const openEditor = useCallback((letter) => {
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
    setErrors({});
  }, []);

  const applyTemplate = useCallback((templateId) => {
    setFormData(prev => ({
      ...prev,
      template: templateId,
      content: generateTemplateContent(templateId, prev.jobTitle, prev.company, prev.hiringManager),
    }));
    setShowTemplateModal(false);
    toast.success(`${templateId} template applied!`);
  }, []);

  // ── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout title="Cover Letter Builder" showWelcome={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <FiLoader className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cover Letter Builder" description="Create professional cover letters" showWelcome={false}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Cover Letters</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Create and manage your cover letters</p>
          </div>
          <Button onClick={() => { setFormData(INITIAL_FORM_DATA); setErrors({}); setShowCreateModal(true); }} icon={<FiPlus />}>
            New Cover Letter
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Your Cover Letters ({coverLetters.length})</h3>
            {coverLetters.length === 0 ? (
              <Card className="p-8 text-center">
                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No cover letters yet</p>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {coverLetters.map(letter => (
                  <div key={letter.id}
                    onClick={() => openEditor(letter)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedLetter?.id === letter.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">{letter.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{letter.jobTitle} at {letter.company}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); handleDownload(letter); }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Download">
                          <FiDownload className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(letter.id); }}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg" title="Delete">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
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
                      <Badge variant="secondary" size="sm" className="capitalize">{selectedLetter.template}</Badge>
                      <button onClick={() => handlePreview({ ...selectedLetter, ...formData })}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Preview">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownload({ ...selectedLetter, ...formData })}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Download">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Cover Letter Name" name="name" value={formData.name} onChange={handleChange}
                      placeholder="e.g., Google Application" error={errors.name} required />
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Link to Resume</label>
                      <select value={formData.resumeId} name="resumeId" onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                        <option value="">None</option>
                        {resumes.map(r => <option key={r.id} value={r.id}>{r.name || 'Untitled'}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange}
                      placeholder="e.g., Software Engineer" icon={<FiBriefcase />} error={errors.jobTitle} required />
                    <Input label="Company" name="company" value={formData.company} onChange={handleChange}
                      placeholder="e.g., Google" error={errors.company} required />
                  </div>

                  <Input label="Hiring Manager" name="hiringManager" value={formData.hiringManager}
                    onChange={handleChange} placeholder="e.g., Jane Smith" icon={<FiUser />} />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Content</label>
                      <Button size="sm" variant="ghost" onClick={() => setShowTemplateModal(true)} icon={<FiLayout />}>Templates</Button>
                    </div>
                    <textarea name="content" value={formData.content} onChange={handleChange} rows={14}
                      className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none text-sm font-mono ${
                        errors.content ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      placeholder="Write your cover letter content... Use [Your Name] as a placeholder." />
                    {errors.content && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><FiAlertCircle className="w-3 h-3" />{errors.content}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setSelectedLetter(null)}>Cancel</Button>
                    <Button onClick={handleUpdate} loading={saving} icon={<FiSave />}>Save Changes</Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Cover Letter</h3>
                <p className="text-gray-500 text-sm mb-4">Select from the list or create a new one</p>
              </Card>
            )}
          </div>
        </div>

        {/* Tips */}
        <Card className="p-5 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FiZap className="w-5 h-5 text-yellow-500" />Cover Letter Tips</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {COVER_LETTER_TIPS.map((tip, i) => <TipCard key={i} {...tip} />)}
          </div>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Cover Letter" size="lg">
        <div className="space-y-4">
          <Input label="Name" name="name" value={formData.name} onChange={handleChange}
            placeholder="e.g., Google Application" error={errors.name} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange}
              placeholder="e.g., Software Engineer" error={errors.jobTitle} required />
            <Input label="Company" name="company" value={formData.company} onChange={handleChange}
              placeholder="e.g., Google" error={errors.company} required />
          </div>
          <Input label="Hiring Manager" name="hiringManager" value={formData.hiringManager} onChange={handleChange} placeholder="e.g., Jane Smith" />
          <div>
            <label className="block text-sm font-medium mb-2">Template</label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => setFormData(prev => ({ ...prev, template: t.id }))}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    formData.template === t.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}>
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
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Apply Template" size="md">
        <p className="text-sm text-gray-500 mb-4">This will replace your current content.</p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button key={t.id} type="button" onClick={() => applyTemplate(t.id)}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 transition-all text-left">
              <span className="text-2xl">{t.icon}</span>
              <p className="font-medium text-sm mt-2">{t.name}</p>
              <p className="text-xs text-gray-500">Professional format</p>
            </button>
          ))}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default CoverLetter;
