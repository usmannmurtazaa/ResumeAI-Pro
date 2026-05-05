import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FiEye, FiCheck, FiSearch } from 'react-icons/fi';
import { usePageTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { useResume } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Professional', 'Executive', 'Creative', 'Minimal', 'Technology', 'Corporate'];

const TEMPLATES = [
  {
    id: 'modern', name: 'Modern Professional',
    description: 'Clean and contemporary design for tech professionals',
    category: 'Professional', popularity: 'Most Popular', icon: '🎨',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'classic', name: 'Classic Executive',
    description: 'Traditional format ideal for senior management',
    category: 'Executive', icon: '📄',
    color: 'from-gray-600 to-gray-800',
  },
  {
    id: 'creative', name: 'Creative Portfolio',
    description: 'Stand out with a unique artistic layout',
    category: 'Creative', popularity: 'New', icon: '✨',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'minimal', name: 'Minimalist',
    description: 'Simple and elegant with focus on content',
    category: 'Minimal', icon: '◻️',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'tech', name: 'Tech Innovator',
    description: 'Modern design optimized for tech and startup roles',
    category: 'Technology', popularity: 'Trending', icon: '💻',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'executive', name: 'Executive Pro',
    description: 'Professional design for senior and C-level positions',
    category: 'Executive', icon: '👔',
    color: 'from-slate-700 to-slate-900',
  },
  {
    id: 'corporate', name: 'Corporate Pro',
    description: 'Polished design for corporate environments',
    category: 'Corporate', icon: '🏢',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'elegant', name: 'Elegant Serif',
    description: 'Sophisticated design for academic and research roles',
    category: 'Professional', icon: '📚',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'startup', name: 'Startup Ready',
    description: 'Bold design for fast-growing companies',
    category: 'Technology', icon: '🚀',
    color: 'from-teal-500 to-cyan-500',
  },
];

// ── Component ─────────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createResume } = useResume();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  usePageTitle({
    title: 'Resume Templates',
    description: 'Browse 25+ ATS-optimized resume templates for every industry.',
  });

  // ── Filtered Templates ───────────────────────────────────────────────

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleUseTemplate = useCallback(async (templateId) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    try {
      const newResume = await createResume({ template: templateId });
      if (newResume?.id) {
        toast.success('Resume created!');
        navigate(`/builder/${newResume.id}`);
      }
    } catch {
      navigate(`/builder?template=${templateId}`);
    }
  }, [user, createResume, navigate]);

  const handlePreview = useCallback((templateId) => {
    navigate(`/builder?template=${templateId}&preview=true`);
  }, [navigate]);

  return (
    <DashboardLayout title="Templates" showWelcome={false}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Resume Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our collection of {TEMPLATES.length}+ ATS-optimized templates
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search templates..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedCategory === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                }`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div key={template.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}>
              <Card className={`p-6 h-full flex flex-col transition-all ${
                selectedTemplate === template.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
              }`} onClick={() => setSelectedTemplate(template.id)}>
                {template.popularity && (
                  <Badge variant="primary" className="mb-3">{template.popularity}</Badge>
                )}

                <div className={`w-full h-40 rounded-lg mb-4 flex items-center justify-center text-5xl bg-gradient-to-br ${template.color}`}>
                  {template.icon}
                </div>

                <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-1">{template.description}</p>

                <div className="flex items-center justify-between mt-auto">
                  <Badge variant="default">{template.category}</Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePreview(template.id); }} icon={<FiEye />}>Preview</Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUseTemplate(template.id); }} icon={<FiCheck />}>
                      {selectedTemplate === template.id ? 'Selected' : 'Use'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Templates;
