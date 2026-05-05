import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiX, FiSearch, FiCode, FiUsers, FiGlobe,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle,
  FiStar, FiInfo, FiTrash2, FiZap, FiGrid, FiList,
  FiUpload, FiDownload, FiRefreshCw,
} from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Card from '../../ui/Card';
import Progress from '../../ui/Progress';
import Tooltip from '../../ui/Tooltip';
import Modal from '../../ui/Modal';
import toast from 'react-hot-toast';

// ── Constants (Module Level) ─────────────────────────────────────────────

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 'intermediate', label: 'Intermediate', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { value: 'advanced', label: 'Advanced', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { value: 'expert', label: 'Expert', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
];

const LANGUAGE_LEVELS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

const SKILL_CATEGORIES = {
  technical: {
    'Programming Languages': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift'],
    'Frontend': ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux'],
    'Backend': ['Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST API'],
    'Database': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'Supabase'],
    'DevOps & Cloud': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform'],
    'Mobile': ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'],
    'Testing': ['Jest', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Testing Library'],
  },
  soft: {
    'Leadership': ['Team Leadership', 'Project Management', 'Strategic Planning', 'Mentoring'],
    'Communication': ['Public Speaking', 'Technical Writing', 'Presentation', 'Negotiation'],
    'Problem Solving': ['Critical Thinking', 'Analytical Skills', 'Troubleshooting'],
    'Collaboration': ['Teamwork', 'Cross-functional Collaboration', 'Stakeholder Management'],
    'Business': ['Product Management', 'Agile Methodology', 'Scrum', 'Business Analysis'],
  },
};

const INDUSTRIES = ['technology', 'marketing', 'finance', 'healthcare', 'sales', 'education', 'engineering', 'design'];

// ── Simple Debounce Hook ──────────────────────────────────────────────────

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);
  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }, [delay]);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return debouncedFn;
};

// ── SkillItem Component (Extracted) ──────────────────────────────────────

const SkillItem = React.memo(({ skill, category, isSelected, onToggle, onRemove, proficiency, onProficiencyChange, yearsOfExperience }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`relative group p-3 rounded-xl border transition-all duration-200 ${
      isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'
    } hover:shadow-md`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={isSelected} onChange={() => onToggle(skill)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        <span className="font-medium text-sm">{skill}</span>
      </div>
      <button type="button" onClick={() => onRemove(category, skill)}
        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
    <select value={proficiency || (category === 'languages' ? 'intermediate' : 'intermediate')}
      onChange={(e) => onProficiencyChange(skill, e.target.value)}
      className="w-full mt-2 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {(category === 'languages' ? LANGUAGE_LEVELS : PROFICIENCY_LEVELS.map(l => l.label)).map(l => (
        <option key={l} value={l.toLowerCase()}>{l}</option>
      ))}
    </select>
    {yearsOfExperience && (
      <Badge size="sm" variant="secondary" className="mt-1">{yearsOfExperience} {yearsOfExperience === '1' ? 'yr' : 'yrs'}</Badge>
    )}
  </motion.div>
));

SkillItem.displayName = 'SkillItem';

// ── Main Component ─────────────────────────────────────────────────────────

const Skills = ({ data = {}, onChange, onValidationChange }) => {
  const [newSkill, setNewSkill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('technical');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('technology');
  const [expandedSections, setExpandedSections] = useState({ technical: true, soft: true, languages: true });
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [skillStats, setSkillStats] = useState({ total: 0, technical: 0, soft: 0, languages: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [importText, setImportText] = useState('');
  const [importCategory, setImportCategory] = useState('technical');

  const mountedRef = useRef(true);

  const { setValue, watch, formState: { isDirty } } = useForm({
    defaultValues: {
      technical: data?.technical || [],
      soft: data?.soft || [],
      languages: data?.languages || [],
      skillDetails: data?.skillDetails || {},
    },
  });

  const technicalSkills = watch('technical') || [];
  const softSkills = watch('soft') || [];
  const languages = watch('languages') || [];
  const skillDetails = watch('skillDetails') || {};

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ── Stats Calculation ────────────────────────────────────────────────

  useEffect(() => {
    const stats = { total: technicalSkills.length + softSkills.length + languages.length, technical: technicalSkills.length, soft: softSkills.length, languages: languages.length };
    setSkillStats(stats);
    onValidationChange?.({ isValid: stats.technical >= 5 && stats.soft >= 3, ...stats });
  }, [technicalSkills, softSkills, languages, onValidationChange]);

  // ── FIXED: Handle Save ────────────────────────────────────────────────

  const handleSave = useCallback((formData) => {
    if (!mountedRef.current) return;
    onChange?.(formData);
    setAutoSaveStatus('saved');
    setTimeout(() => { if (mountedRef.current) setAutoSaveStatus('idle'); }, 3000);
  }, [onChange]);

  const debouncedSave = useDebounce(handleSave, 1000);

  useEffect(() => {
    if (isDirty) {
      setAutoSaveStatus('saving');
      debouncedSave({ technical: technicalSkills, soft: softSkills, languages, skillDetails });
    }
  }, [technicalSkills, softSkills, languages, skillDetails, isDirty, debouncedSave]);

  // ── Skill CRUD ────────────────────────────────────────────────────────

  const addSkill = useCallback((category) => {
    if (!newSkill.trim()) { toast.error('Enter a skill'); return; }
    const skills = watch(category) || [];
    const name = newSkill.trim();
    if (skills.includes(name)) { toast.error('Already exists'); return; }
    setValue(category, [...skills, name], { shouldDirty: true });
    if (!skillDetails[name]) {
      setValue(`skillDetails.${name}`, { proficiency: category === 'languages' ? 'intermediate' : 'intermediate', category, yearsOfExperience: '', lastUsed: '' }, { shouldDirty: true });
    }
    toast.success(`Added ${name}`);
    setNewSkill('');
  }, [newSkill, watch, setValue, skillDetails]);

  const removeSkill = useCallback((category, skill) => {
    const skills = watch(category) || [];
    setValue(category, skills.filter(s => s !== skill), { shouldDirty: true });
    setSelectedSkills(p => { const n = new Set(p); n.delete(skill); return n; });
    toast.success(`Removed ${skill}`);
  }, [watch, setValue]);

  const removeSelectedSkills = useCallback(() => {
    if (selectedSkills.size === 0) { toast.error('No skills selected'); return; }
    ['technical', 'soft', 'languages'].forEach(cat => {
      const skills = watch(cat) || [];
      setValue(cat, skills.filter(s => !selectedSkills.has(s)), { shouldDirty: true });
    });
    setSelectedSkills(new Set());
    toast.success(`Removed ${selectedSkills.size} skills`);
  }, [selectedSkills, watch, setValue]);

  // ── Selection ─────────────────────────────────────────────────────────

  const toggleSkillSelection = useCallback((skill) => {
    setSelectedSkills(p => { const n = new Set(p); n.has(skill) ? n.delete(skill) : n.add(skill); return n; });
  }, []);

  const selectAllSkills = useCallback((category, e) => {
    e?.stopPropagation();
    const skills = watch(category) || [];
    setSelectedSkills(p => new Set([...p, ...skills]));
  }, [watch]);

  const clearSelection = useCallback(() => setSelectedSkills(new Set()), []);

  // ── Proficiency ───────────────────────────────────────────────────────

  const updateProficiency = useCallback((skill, proficiency) => {
    setValue(`skillDetails.${skill}.proficiency`, proficiency, { shouldDirty: true });
  }, [setValue]);

  // ── Suggestions ───────────────────────────────────────────────────────

  const getSuggestions = useCallback(() => {
    // FIXED: Use inline suggestions instead of missing external import
    const allTech = Object.values(SKILL_CATEGORIES.technical).flat();
    const current = [...technicalSkills, ...softSkills];
    const suggested = allTech.filter(s => !current.includes(s)).sort(() => 0.5 - Math.random()).slice(0, 15);
    setSuggestions(suggested);
    setShowSuggestionsModal(true);
  }, [technicalSkills, softSkills]);

  const addSuggestion = useCallback((skill) => {
    if (!technicalSkills.includes(skill)) {
      setValue('technical', [...technicalSkills, skill], { shouldDirty: true });
      if (!skillDetails[skill]) setValue(`skillDetails.${skill}`, { proficiency: 'intermediate', category: 'technical', yearsOfExperience: '', lastUsed: '' }, { shouldDirty: true });
      setSuggestions(p => p.filter(s => s !== skill));
      toast.success(`Added ${skill}`);
    }
  }, [technicalSkills, skillDetails, setValue]);

  // ── Import/Export ─────────────────────────────────────────────────────

  const handleImportFromText = useCallback(() => {
    if (!importText.trim()) { toast.error('Paste skills first'); return; }
    const skills = importText.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const current = watch(importCategory) || [];
    const newSkills = skills.filter(s => !current.includes(s));
    if (newSkills.length === 0) { toast.error('All skills already exist'); return; }
    setValue(importCategory, [...current, ...newSkills], { shouldDirty: true });
    newSkills.forEach(s => {
      if (!skillDetails[s]) setValue(`skillDetails.${s}`, { proficiency: importCategory === 'languages' ? 'intermediate' : 'intermediate', category: importCategory, yearsOfExperience: '', lastUsed: '' }, { shouldDirty: true });
    });
    toast.success(`Imported ${newSkills.length} skills`);
    setImportText('');
    setShowImportModal(false);
  }, [importText, importCategory, watch, setValue, skillDetails]);

  const handleImportFromJobDesc = useCallback(() => {
    const mock = { technical: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], soft: ['Team Leadership', 'Problem Solving', 'Communication'] };
    ['technical', 'soft'].forEach(cat => {
      const current = watch(cat) || [];
      const newSkills = mock[cat].filter(s => !current.includes(s));
      if (newSkills.length > 0) {
        setValue(cat, [...current, ...newSkills], { shouldDirty: true });
        newSkills.forEach(s => { if (!skillDetails[s]) setValue(`skillDetails.${s}`, { proficiency: 'intermediate', category: cat, yearsOfExperience: '', lastUsed: '' }, { shouldDirty: true }); });
      }
    });
    toast.success('Skills imported from job description!');
    setShowImportModal(false);
  }, [watch, setValue, skillDetails]);

  const exportSkills = useCallback(() => {
    const exportData = { technical: technicalSkills, soft: softSkills, languages, skillDetails };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `skills-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Skills exported!');
  }, [technicalSkills, softSkills, languages, skillDetails]);

  // ── Filtered Skills ──────────────────────────────────────────────────

  const getFilteredSkills = useCallback((skills) => {
    if (!searchTerm) return skills;
    return skills.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  // ── Render ─────────────────────────────────────────────────────────────

  const toggleSection = (s) => setExpandedSections(p => ({ ...p, [s]: !p[s] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Skills</h3>
            <Badge variant="primary" size="sm">{skillStats.total} Total</Badge>
            {skillStats.technical >= 5 && skillStats.soft >= 3 && <Badge variant="success" size="sm"><FiCheckCircle className="w-3 h-3 mr-1" />Optimized</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span><FiCode className="w-4 h-4 inline mr-1" />{skillStats.technical}</span>
            <span><FiUsers className="w-4 h-4 inline mr-1" />{skillStats.soft}</span>
            <span><FiGlobe className="w-4 h-4 inline mr-1" />{skillStats.languages}</span>
            {autoSaveStatus === 'saved' && <span className="text-green-500"><FiCheckCircle className="w-3 h-3 inline mr-1" />Saved</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['grid', 'list'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-sm rounded-md ${viewMode === m ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>{m === 'grid' ? <FiGrid className="w-4 h-4" /> : <FiList className="w-4 h-4" />}</button>
            ))}
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 w-40" />
          </div>
          {selectedSkills.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedSkills.size}</Badge>
              <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
              <Button variant="danger" size="sm" onClick={removeSelectedSkills} icon={<FiTrash2 />}>Remove</Button>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={getSuggestions} icon={<FiSearch />}>Suggest</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowImportModal(true)} icon={<FiUpload />}>Import</Button>
          <Button type="button" variant="outline" size="sm" onClick={exportSkills} icon={<FiDownload />}>Export</Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: skillStats.technical, label: 'Technical', target: 10, color: 'text-blue-600' },
            { value: skillStats.soft, label: 'Soft', target: 5, color: 'text-green-600' },
            { value: skillStats.languages, label: 'Languages', target: 3, color: 'text-purple-600' },
          ].map((s, i) => (
            <div key={i}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <Progress value={Math.min((s.value / s.target) * 100, 100)} size="sm" className="mt-1" />
            </div>
          ))}
        </div>
        {skillStats.technical < 5 && (
          <p className="text-xs text-yellow-600 mt-3"><FiAlertCircle className="w-3 h-3 inline mr-1" />Add at least 5 technical skills for ATS optimization</p>
        )}
      </Card>

      {/* Skill Sections */}
      <div className="space-y-4">
        {[
          { title: 'Technical Skills', skills: technicalSkills, category: 'technical', icon: FiCode, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
          { title: 'Soft Skills', skills: softSkills, category: 'soft', icon: FiUsers, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
          { title: 'Languages', skills: languages, category: 'languages', icon: FiGlobe, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
        ].map(({ title, skills, category, icon: Icon, color }) => (
          <Card key={category} className="overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => toggleSection(category)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
                  <div><h4 className="font-semibold text-sm">{title}</h4><p className="text-xs text-gray-500">{skills.length} skills</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {skills.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={(e) => selectAllSkills(category, e)}>Select All</Button>}
                  {expandedSections[category] ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>
            </div>
            <AnimatePresence>
              {expandedSections[category] && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-4 sm:px-5 pb-5 space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder={`Add ${category} skill...`} value={newSkill} onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(category); } }} wrapperClassName="flex-1" />
                    <Button type="button" onClick={() => addSkill(category)} icon={<FiPlus />}>Add</Button>
                  </div>
                  {getFilteredSkills(skills).length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2'}>
                      <AnimatePresence>
                        {getFilteredSkills(skills).map(skill => (
                          <SkillItem key={skill} skill={skill} category={category}
                            isSelected={selectedSkills.has(skill)} onToggle={toggleSkillSelection} onRemove={removeSkill}
                            proficiency={skillDetails[skill]?.proficiency} onProficiencyChange={updateProficiency}
                            yearsOfExperience={skillDetails[skill]?.yearsOfExperience} />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No {category} skills yet</p>
                      {category === 'technical' && <Button type="button" variant="ghost" size="sm" onClick={getSuggestions} className="mt-2">Get Suggestions</Button>}
                    </div>
                  )}
                  {/* Quick Add from Categories */}
                  {category === 'technical' && (
                    <details>
                      <summary className="cursor-pointer text-sm text-primary-500">Quick add from categories</summary>
                      <div className="mt-2 space-y-2">
                        {Object.entries(SKILL_CATEGORIES.technical).map(([cat, sks]) => (
                          <div key={cat}><p className="text-xs text-gray-500 mb-1">{cat}</p>
                            <div className="flex flex-wrap gap-1">
                              {sks.map(s => (
                                <button key={s} type="button" onClick={() => { if (!technicalSkills.includes(s)) { setValue('technical', [...technicalSkills, s], { shouldDirty: true }); if (!skillDetails[s]) setValue(`skillDetails.${s}`, { proficiency: 'intermediate', category: 'technical', yearsOfExperience: '', lastUsed: '' }, { shouldDirty: true }); } }}
                                  disabled={technicalSkills.includes(s)}
                                  className={`px-2 py-0.5 text-xs rounded ${technicalSkills.includes(s) ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}>{s}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>

      {/* Suggestions Modal */}
      <Modal isOpen={showSuggestionsModal} onClose={() => setShowSuggestionsModal(false)} title="Skill Suggestions" size="lg">
        <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)} className="input-field mb-4">
          {INDUSTRIES.map(i => <option key={i} value={i} className="capitalize">{i}</option>)}
        </select>
        <Button onClick={getSuggestions} icon={<FiRefreshCw />} className="mb-4">Refresh</Button>
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => addSuggestion(s)} disabled={technicalSkills.includes(s)}
              className={`p-3 rounded-lg text-left text-sm ${technicalSkills.includes(s) ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 hover:bg-primary-50'}`}>
              <div className="flex items-center justify-between">{s}{technicalSkills.includes(s) ? <FiCheckCircle className="w-4 h-4 text-green-500" /> : <FiPlus className="w-4 h-4" />}</div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Skills">
        <div className="space-y-4">
          <Button variant="outline" onClick={handleImportFromJobDesc} className="w-full" icon={<FiZap />}>Import from Job Description</Button>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div><div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-gray-900 text-gray-500 text-sm">or</span></div></div>
          <textarea rows={5} value={importText} onChange={e => setImportText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
            placeholder="React, Node.js, Python&#10;Team Leadership&#10;Problem Solving" />
          <div className="flex gap-2">
            <select value={importCategory} onChange={e => setImportCategory(e.target.value)} className="input-field !py-2 !w-auto">
              <option value="technical">Technical</option><option value="soft">Soft</option><option value="languages">Languages</option>
            </select>
            <Button onClick={handleImportFromText} className="flex-1">Import</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(Skills);
