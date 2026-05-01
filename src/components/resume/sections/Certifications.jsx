import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiCalendar, FiAward, FiExternalLink,
  FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle,
  FiCopy, FiStar, FiClock, FiSearch, FiEye,
  FiX, FiInfo,
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

const CERTIFICATION_CATEGORIES = [
  { id: 'cloud', name: 'Cloud Computing', icon: '☁️' },
  { id: 'project-management', name: 'Project Management', icon: '📊' },
  { id: 'agile', name: 'Agile & Scrum', icon: '🔄' },
  { id: 'data-science', name: 'Data Science & AI', icon: '📈' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
  { id: 'programming', name: 'Programming', icon: '💻' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'marketing', name: 'Digital Marketing', icon: '📱' },
  { id: 'language', name: 'Language', icon: '🌐' },
  { id: 'other', name: 'Other', icon: '📜' },
];

const POPULAR_CERTIFICATIONS = {
  cloud: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { name: 'Microsoft Certified: Azure Administrator', issuer: 'Microsoft' },
    { name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud' },
  ],
  'project-management': [
    { name: 'Project Management Professional (PMP)', issuer: 'PMI' },
    { name: 'Certified Associate in Project Management (CAPM)', issuer: 'PMI' },
  ],
  agile: [
    { name: 'Certified ScrumMaster (CSM)', issuer: 'Scrum Alliance' },
    { name: 'Professional Scrum Master (PSM)', issuer: 'Scrum.org' },
  ],
  'data-science': [
    { name: 'Google Data Analytics Professional Certificate', issuer: 'Google' },
    { name: 'IBM Data Science Professional Certificate', issuer: 'IBM' },
  ],
  cybersecurity: [
    { name: 'CompTIA Security+', issuer: 'CompTIA' },
    { name: 'Certified Information Systems Security Professional (CISSP)', issuer: '(ISC)²' },
  ],
  programming: [
    { name: 'Oracle Certified Professional: Java SE', issuer: 'Oracle' },
    { name: 'AWS Certified Developer', issuer: 'Amazon Web Services' },
  ],
};

// ── Utility Functions ────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const checkExpiryStatus = (expiryDate, neverExpires) => {
  if (neverExpires) return { status: 'valid', label: 'No Expiry', color: 'text-blue-500' };
  if (!expiryDate) return { status: 'unknown', label: 'No Date', color: 'text-gray-400' };
  const expiry = new Date(expiryDate);
  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  if (expiry < now) return { status: 'expired', label: 'Expired', color: 'text-red-500' };
  if (expiry <= threeMonthsFromNow) return { status: 'expiring', label: 'Expiring Soon', color: 'text-yellow-500' };
  return { status: 'valid', label: 'Valid', color: 'text-green-500' };
};

const getCategorySuggestions = (category) => {
  if (category && POPULAR_CERTIFICATIONS[category]) {
    return POPULAR_CERTIFICATIONS[category];
  }
  return Object.values(POPULAR_CERTIFICATIONS).flat().slice(0, 6);
};

const createEmptyCertification = () => ({
  name: '', issuer: '', date: '', expiryDate: '', credentialId: '',
  link: '', category: 'other', score: '', description: '',
  neverExpires: false, verified: false,
});

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

// ── Component ─────────────────────────────────────────────────────────────

const Certifications = ({ data = [], onChange, onValidationChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('detailed');
  const [sortOrder, setSortOrder] = useState('date');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [certStats, setCertStats] = useState({ total: 0, verified: 0, expiring: 0, categories: {} });

  const mountedRef = useRef(true);
  const previousDataRef = useRef(data);

  const { register, control, watch, setValue, formState: { errors, isDirty } } = useForm({
    defaultValues: { certifications: data?.length ? data : [createEmptyCertification()] },
    mode: 'onChange',
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'certifications' });
  const watchedFields = watch('certifications');

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data;
      data?.forEach((item, i) => Object.entries(item).forEach(([k, v]) => setValue(`certifications.${i}.${k}`, v)));
    }
  }, [data, setValue]);

  // ── FIXED: Handle Save ────────────────────────────────────────────────

  const handleSave = useCallback((formData) => {
    if (!mountedRef.current) return;
    const sorted = [...(formData || [])].sort((a, b) => {
      if (sortOrder === 'date') return (b.date || '').localeCompare(a.date || '');
      if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortOrder === 'issuer') return (a.issuer || '').localeCompare(b.issuer || '');
      return 0;
    });
    onChange?.(sorted);
    setAutoSaveStatus('saved');
    setTimeout(() => { if (mountedRef.current) setAutoSaveStatus('idle'); }, 3000);
  }, [sortOrder, onChange]);

  const debouncedSave = useDebounce(handleSave, 1000);

  useEffect(() => {
    if (isDirty && watchedFields) {
      setAutoSaveStatus('saving');
      debouncedSave(watchedFields);
    }
  }, [watchedFields, isDirty, debouncedSave]);

  // ── Stats & Completion ────────────────────────────────────────────────

  useEffect(() => {
    if (!watchedFields) return;
    let total = 0, completed = 0;
    const categories = {};
    let verified = 0, expiring = 0;
    
    watchedFields.forEach(cert => {
      ['name', 'issuer'].forEach(f => { total++; if (cert[f]?.trim()) completed++; });
      categories[cert.category] = (categories[cert.category] || 0) + 1;
      if (cert.verified) verified++;
      if (cert.expiryDate && !cert.neverExpires) {
        const expiry = new Date(cert.expiryDate);
        const threeMo = new Date();
        threeMo.setMonth(threeMo.getMonth() + 3);
        if (expiry <= threeMo && expiry > new Date()) expiring++;
      }
    });
    
    setCompletionPercentage(total > 0 ? Math.round((completed / total) * 100) : 0);
    setCertStats({ total: watchedFields.length, verified, expiring, categories });
    onValidationChange?.({ isValid: Object.keys(errors).length === 0, completionPercentage, count: fields.length });
  }, [watchedFields, errors, fields.length, onValidationChange]);

  // ── FIXED: Memoized Filtered Certifications ──────────────────────────

  const filteredCertifications = useMemo(() => {
    if (!watchedFields) return [];
    return watchedFields
      .map((cert, idx) => ({ cert, originalIndex: idx }))
      .filter(({ cert }) => {
        if (selectedCategory !== 'all' && cert.category !== selectedCategory) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (cert.name || '').toLowerCase().includes(term) ||
                 (cert.issuer || '').toLowerCase().includes(term) ||
                 (cert.credentialId || '').toLowerCase().includes(term);
        }
        return true;
      });
  }, [watchedFields, selectedCategory, searchTerm]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const addCertification = useCallback(() => { append(createEmptyCertification()); toast.success('Certification added'); }, [append]);
  const removeCertification = useCallback((idx) => { remove(idx); toast.success('Certification removed'); }, [remove]);
  const toggleExpand = useCallback((idx) => setExpandedItems(p => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; }), []);
  const toggleVerified = useCallback((idx) => { const v = watchedFields[idx]?.verified; setValue(`certifications.${idx}.verified`, !v); toast.success(v ? 'Verification removed' : 'Marked verified'); }, [watchedFields, setValue]);
  const moveItem = useCallback((f, t) => { if (t >= 0 && t < fields.length) { move(f, t); toast.success('Order updated'); } }, [fields.length, move]);

  // ── Animation ─────────────────────────────────────────────────────────

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 } };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">Certifications</h3>
            {fields.length > 0 && <Badge variant="primary" size="sm">{fields.length}</Badge>}
            {certStats.verified > 0 && <Badge variant="success" size="sm"><FiCheckCircle className="w-3 h-3 mr-1" />{certStats.verified} Verified</Badge>}
            {certStats.expiring > 0 && <Badge variant="warning" size="sm"><FiClock className="w-3 h-3 mr-1" />{certStats.expiring} Expiring</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <Progress value={completionPercentage} size="sm" showPercentage className="max-w-xs" />
            {autoSaveStatus === 'saved' && <span className="text-xs text-green-500"><FiCheckCircle className="w-3 h-3 inline mr-1" />Saved</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="input-field !py-2 !w-auto text-sm">
            <option value="date">Most Recent</option><option value="name">By Name</option><option value="issuer">By Issuer</option>
          </select>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['detailed', 'compact'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-sm rounded-md capitalize ${viewMode === m ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>{m}</button>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => setShowSuggestions(true)} icon={<FiSearch />}>Suggest</Button>
          <Button type="button" variant="primary" onClick={addCertification} icon={<FiPlus />}>Add</Button>
        </div>
      </div>

      {/* Filters */}
      {fields.length > 0 && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-sm" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><FiX className="w-4 h-4" /></button>}
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-field !py-2 !w-auto text-sm">
            <option value="all">All Categories</option>
            {CERTIFICATION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}

      {/* Certifications List */}
      <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
          {filteredCertifications.map(({ cert, originalIndex }) => {
            const expiryStatus = checkExpiryStatus(cert.expiryDate, cert.neverExpires);
            const isExpanded = expandedItems.has(originalIndex) || viewMode === 'detailed';

            return (
              <motion.div key={fields[originalIndex]?.id || originalIndex} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className={`relative ${cert.verified ? 'ring-1 ring-green-400' : ''}`}>
                  {/* Compact Header */}
                  <div className="p-4 cursor-pointer" onClick={() => viewMode === 'compact' && toggleExpand(originalIndex)}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-xl flex-shrink-0">
                        {CERTIFICATION_CATEGORIES.find(c => c.id === cert.category)?.icon || '📜'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold truncate flex items-center gap-1.5">
                              {cert.name || 'New Certification'}
                              {cert.verified && <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">{cert.issuer || 'Issuing Organization'}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={e => { e.stopPropagation(); moveItem(originalIndex, originalIndex - 1); }}
                              disabled={originalIndex === 0} className={`p-1 rounded ${originalIndex === 0 ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                              <FiChevronUp className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); moveItem(originalIndex, originalIndex + 1); }}
                              disabled={originalIndex === fields.length - 1} className={`p-1 rounded ${originalIndex === fields.length - 1 ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                              <FiChevronDown className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                          {cert.date && <span className="text-gray-500"><FiCalendar className="w-3 h-3 inline mr-1" />{formatDate(cert.date)}</span>}
                          <span className={expiryStatus.color}><FiClock className="w-3 h-3 inline mr-1" />{expiryStatus.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-5 pb-5 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-end gap-2 pt-4">
                          <button type="button" onClick={() => toggleVerified(originalIndex)}
                            className={`p-2 rounded-lg ${cert.verified ? 'text-green-500 bg-green-50' : 'text-gray-500 hover:text-green-500'}`}>
                            <FiCheckCircle className="w-4 h-4" /></button>
                          <button type="button" onClick={() => { setSelectedCert(cert); setShowPreviewModal(true); }}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg"><FiEye className="w-4 h-4" /></button>
                          <button type="button" onClick={() => { const dup = { ...watchedFields[originalIndex] }; delete dup.id; append(dup); }}
                            className="p-2 text-gray-500 hover:text-primary-500 rounded-lg"><FiCopy className="w-4 h-4" /></button>
                          <button type="button" onClick={() => removeCertification(originalIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Certification Name" icon={<FiAward />} placeholder="e.g., AWS Certified Solutions Architect"
                            {...register(`certifications.${originalIndex}.name`, { required: 'Required' })} />
                          <Input label="Issuing Organization" placeholder="e.g., Amazon Web Services"
                            {...register(`certifications.${originalIndex}.issuer`, { required: 'Required' })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <select {...register(`certifications.${originalIndex}.category`)} className="input-field">
                            {CERTIFICATION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Issue Date" type="month" icon={<FiCalendar />} {...register(`certifications.${originalIndex}.date`)} />
                          <div>
                            <Input label="Expiry Date" type="month" icon={<FiCalendar />} disabled={cert.neverExpires} {...register(`certifications.${originalIndex}.expiryDate`)} />
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                              <input type="checkbox" {...register(`certifications.${originalIndex}.neverExpires`)} className="rounded border-gray-300 text-primary-600" />
                              <span className="text-sm">Never expires</span>
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Credential ID" icon={<FiAward />} placeholder="e.g., AWS-ASA-12345" {...register(`certifications.${originalIndex}.credentialId`)} />
                          <Input label="Score (Optional)" placeholder="e.g., 92%" {...register(`certifications.${originalIndex}.score`)} />
                        </div>
                        <Input label="Credential URL" icon={<FiExternalLink />} placeholder="https://www.credly.com/..." {...register(`certifications.${originalIndex}.link`)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty States */}
        {fields.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <FiAward className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Certifications</h4>
            <p className="text-gray-500 mb-4">Add your professional certifications</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={addCertification} icon={<FiPlus />}>Add</Button>
              <Button variant="outline" onClick={() => setShowSuggestions(true)} icon={<FiSearch />}>Browse</Button>
            </div>
          </motion.div>
        )}
        {fields.length > 0 && filteredCertifications.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <p className="text-gray-500">No certifications match your search</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>Clear filters</Button>
          </motion.div>
        )}
      </motion.div>

      {/* Suggestions Modal */}
      <Modal isOpen={showSuggestions} onClose={() => setShowSuggestions(false)} title="Popular Certifications" size="lg">
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full input-field mb-4">
          <option value="all">All Categories</option>
          {CERTIFICATION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {getCategorySuggestions(selectedCategory === 'all' ? null : selectedCategory).map((cert, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300">
              <div>
                <p className="font-medium text-sm">{cert.name}</p>
                <p className="text-xs text-gray-500">{cert.issuer}</p>
              </div>
              <Button size="sm" onClick={() => { append({ ...createEmptyCertification(), name: cert.name, issuer: cert.issuer, category: selectedCategory !== 'all' ? selectedCategory : 'other' }); toast.success('Added'); setShowSuggestions(false); }} icon={<FiPlus />}>Add</Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Certificate Preview">
        {selectedCert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl">
                {CERTIFICATION_CATEGORIES.find(c => c.id === selectedCert.category)?.icon || '📜'}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedCert.name}</h3>
                <p className="text-primary-600 dark:text-primary-400 text-sm">{selectedCert.issuer}</p>
              </div>
            </div>
            {selectedCert.date && <p className="text-sm"><span className="text-gray-500">Issued:</span> {formatDate(selectedCert.date)}</p>}
            {selectedCert.credentialId && <p className="text-sm"><span className="text-gray-500">ID:</span> <code className="font-mono">{selectedCert.credentialId}</code></p>}
            {selectedCert.link && (
              <Button variant="outline" onClick={() => window.open(selectedCert.link, '_blank')} className="w-full" icon={<FiExternalLink />}>Verify</Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(Certifications);