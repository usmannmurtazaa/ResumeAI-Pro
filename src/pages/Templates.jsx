import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  FiEye,
  FiCheck,
  FiSearch,
  FiLayout,
  FiFileText,
  FiStar,
  FiCpu,
  FiBook,
} from 'react-icons/fi';
import { usePageTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../hooks/useAuth';
import { useResume } from '../contexts/ResumeContext';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Professional', 'Executive', 'Creative', 'Technology', 'Academic'];

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and contemporary design for tech professionals',
    category: 'Professional',
    popularity: 'Most Popular',
    Icon: FiLayout,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'classic',
    name: 'Classic Executive',
    description: 'Traditional format ideal for senior management',
    category: 'Executive',
    Icon: FiFileText,
    color: 'from-gray-600 to-gray-800',
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Stand out with a unique artistic layout',
    category: 'Creative',
    popularity: 'New',
    Icon: FiStar,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'tech',
    name: 'Tech Innovator',
    description: 'Modern design optimized for tech and startup roles',
    category: 'Technology',
    popularity: 'Trending',
    Icon: FiCpu,
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'elegant',
    name: 'Elegant Serif',
    description: 'Sophisticated design for academic and research roles',
    category: 'Academic',
    Icon: FiBook,
    color: 'from-rose-500 to-pink-600',
  },
];

// ── Component ─────────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createResume } = useResume();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  usePageTitle({
    title: 'Resume Templates',
    description: 'Browse ATS-optimized resume templates for every industry.',
  });

  // FIX 6 — Memoized filter. Recomputes only when the search term or the
  // selected category actually changes, matching the pattern used by the
  // other list components in this project (ResumeList, TemplateSelector).
  const filteredTemplates = useMemo(
    () =>
      TEMPLATES.filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [searchTerm, selectedCategory]
  );

  const handleUseTemplate = useCallback(
    async (templateId) => {
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
    },
    [user, createResume, navigate]
  );

  const handlePreview = useCallback(
    (templateId) => {
      navigate(`/builder?template=${templateId}&preview=true`);
    },
    [navigate]
  );

  return (
    <DashboardLayout title="Templates" showWelcome={false}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Resume Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our collection of {TEMPLATES.length} ATS-optimized templates
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                // FIX 2 — dark-mode hover now matches the rest of the app.
                // FIX 5 — explicit focus-visible ring for parity with other
                //          interactive elements. `focus:outline-none` lets
                //          the ring replace the global focus outline.
                className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            /*
             * FIX 4 — The outer motion.div now owns the entrance + stagger
             * animation. Card is rendered with `animate={false}` so it does
             * not stack a second `initial={{ y: 20 }}` on top of this one
             * (which was producing a net y: +40 offset and a heavier
             * entrance than the code implied).
             *
             * The tap scale feedback that Card used to supply via
             * `whileTap` is now applied here, so nothing is lost.
             */
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                opacity: { delay: index * 0.05, duration: 0.3 },
                y: { delay: index * 0.05, duration: 0.3 },
                scale: { duration: 0.1 },
              }}
            >
              <Card
                // FIX 3 — `clickable` adds role="button", tabIndex=0,
                // cursor-pointer, and Enter/Space keyboard handling. The
                // card body is now reachable and actionable by keyboard
                // users, matching the visual affordance the hover lift
                // already suggested to mouse users.
                clickable
                animate={false}
                className={`p-6 h-full flex flex-col transition-all ${
                  selectedTemplate === template.id ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                {template.popularity && (
                  <Badge variant="primary" className="mb-3">
                    {template.popularity}
                  </Badge>
                )}

                <div
                  className={`w-full h-40 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br ${template.color}`}
                >
                  <template.Icon className="w-16 h-16 text-white" />
                </div>

                <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-1">
                  {template.description}
                </p>

                {/*
                 * FIX 1 — At 320–414 px the badge and both buttons cannot
                 * fit on one line (~325 px of content in ~240 px of
                 * available space). Stack them vertically below `sm`:
                 * badge on its own row, buttons side-by-side underneath.
                 * From `sm` upward, revert to the original horizontal
                 * layout. Each button gets `flex-1 sm:flex-none` so they
                 * share the row equally on mobile.
                 */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-auto">
                  <Badge variant="default" className="self-start">
                    {template.category}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template.id);
                      }}
                      icon={<FiEye />}
                      className="flex-1 sm:flex-none"
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template.id);
                      }}
                      icon={<FiCheck />}
                      className="flex-1 sm:flex-none"
                    >
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