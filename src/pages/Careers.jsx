import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBriefcase, FiMapPin, FiClock, FiUsers, FiHeart,
  FiCoffee, FiZap, FiGlobe, FiGift, FiTrendingUp,
  FiCalendar, FiDollarSign, FiArrowRight, FiSearch,
  FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle,
  FiStar, FiAward, FiShield, FiTarget, FiCode,
  FiMonitor, FiLayers, FiMessageCircle,
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { usePageTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: 'all', name: 'All Departments', icon: FiLayers },
  { id: 'engineering', name: 'Engineering', icon: FiCode },
  { id: 'product', name: 'Product', icon: FiTarget },
  { id: 'design', name: 'Design', icon: FiMonitor },
  { id: 'marketing', name: 'Marketing', icon: FiTrendingUp },
  { id: 'sales', name: 'Sales', icon: FiBriefcase },
  { id: 'customer-success', name: 'Customer Success', icon: FiHeart },
];

const LOCATIONS = [
  { id: 'all', name: 'All Locations' },
  { id: 'remote', name: 'Remote' },
  { id: 'san-francisco', name: 'San Francisco, CA' },
  { id: 'new-york', name: 'New York, NY' },
  { id: 'london', name: 'London, UK' },
  { id: 'berlin', name: 'Berlin, Germany' },
  { id: 'singapore', name: 'Singapore' },
];

const VALUES = [
  { icon: FiTarget, title: 'User-First', description: 'Every decision starts with our users.' },
  { icon: FiZap, title: 'Move Fast', description: 'We value speed and iteration.' },
  { icon: FiUsers, title: 'Collaborative', description: 'Great ideas come from everywhere.' },
  { icon: FiShield, title: 'Integrity', description: 'We do the right thing, always.' },
];

const PERKS = [
  { icon: FiGlobe, title: 'Remote-First', description: 'Work from anywhere in the world.' },
  { icon: FiHeart, title: 'Health & Wellness', description: 'Comprehensive coverage for you and your family.' },
  { icon: FiTrendingUp, title: 'Growth & Development', description: 'Learning stipend, conferences, mentorship.' },
  { icon: FiCalendar, title: 'Unlimited PTO', description: 'Take the time you need to recharge.' },
  { icon: FiCoffee, title: 'Home Office Setup', description: 'Stipend for your perfect workspace.' },
  { icon: FiGift, title: 'Equity Package', description: 'Every employee receives equity.' },
];

const JOB_LISTINGS = [
  {
    id: 1,
    title: 'Senior Full-Stack Engineer',
    department: 'engineering',
    location: 'remote',
    type: 'Full-time',
    experience: '5+ years',
    salary: '$140k - $180k',
    posted: '2 days ago',
    description: 'Build and scale our resume builder platform with React, Node.js, and Firebase.',
    requirements: [
      '5+ years full-stack development',
      'React, Node.js, TypeScript expertise',
      'Firebase and cloud architecture',
      'Web performance and SEO knowledge',
    ],
    niceToHave: ['AI/ML experience', 'Open-source contributions', 'PDF generation knowledge'],
    benefits: ['Competitive salary + equity', 'Remote-first', 'Health insurance', '401(k)', 'Unlimited PTO'],
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'product',
    location: 'san-francisco',
    type: 'Full-time',
    experience: '3+ years',
    salary: '$120k - $160k',
    posted: '1 week ago',
    description: 'Drive the vision and execution of our resume builder platform.',
    requirements: ['3+ years PM experience', 'Data-driven decision making', 'SaaS experience', 'Stakeholder management'],
    niceToHave: ['HR tech experience', 'MBA', 'UI/UX sensibility'],
    benefits: ['Competitive salary + equity', 'Hybrid model', 'Health benefits', '401(k)', 'Flexible PTO'],
  },
  {
    id: 3,
    title: 'Senior Product Designer',
    department: 'design',
    location: 'remote',
    type: 'Full-time',
    experience: '4+ years',
    salary: '$120k - $160k',
    posted: '3 days ago',
    description: 'Create beautiful, intuitive experiences for our users.',
    requirements: ['4+ years product design', 'Figma expertise', 'User research experience', 'Accessibility knowledge'],
    niceToHave: ['B2B SaaS experience', 'Motion design', 'Front-end knowledge'],
    benefits: ['Competitive salary + equity', 'Remote-first', 'Health insurance', '401(k)', 'Unlimited PTO'],
  },
  {
    id: 4,
    title: 'AI/ML Engineer',
    department: 'engineering',
    location: 'remote',
    type: 'Full-time',
    experience: '3+ years',
    salary: '$150k - $200k',
    posted: '5 days ago',
    description: 'Build intelligent features using NLP, recommendation systems, and content generation.',
    requirements: ['3+ years AI/ML', 'Python and ML frameworks', 'NLP and LLMs experience', 'MS/PhD preferred'],
    niceToHave: ['Publications', 'OpenAI APIs', 'Vector databases'],
    benefits: ['Competitive salary + equity', 'Remote-first', 'Health benefits', '401(k)', 'Conference budget'],
  },
  {
    id: 5,
    title: 'Technical Recruiter',
    department: 'product',
    location: 'remote',
    type: 'Contract',
    experience: '2+ years',
    salary: '$80k - $100k',
    posted: '1 day ago',
    description: 'Help us grow our engineering and product teams.',
    requirements: ['2+ years technical recruiting', 'Sourcing skills', 'ATS experience'],
    niceToHave: ['Startup experience', 'Technical background', 'Remote hiring'],
    benefits: ['Competitive rate', 'Remote work', 'Flexible schedule', 'Contract-to-hire'],
  },
];

// ── Sub-Components ────────────────────────────────────────────────────────

const StatCard = React.memo(({ icon: Icon, value, label }) => (
  <Card className="p-6 text-center">
    <Icon className="w-8 h-8 mx-auto mb-3 text-primary-500" />
    <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{value}</div>
    <div className="text-gray-600 dark:text-gray-400 text-sm">{label}</div>
  </Card>
));

StatCard.displayName = 'StatCard';

// ── Main Component ────────────────────────────────────────────────────────

const Careers = () => {
  usePageTitle({
    title: 'Careers - Join Our Team',
    description: 'Join ResumeAI Pro and help millions of job seekers land their dream jobs. View open positions in engineering, product, design, and more.',
  });

  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Filtered Jobs ────────────────────────────────────────────────────

  const filteredJobs = useMemo(() => {
    return JOB_LISTINGS.filter(job => {
      const matchesDept = selectedDepartment === 'all' || job.department === selectedDepartment;
      const matchesLoc = selectedLocation === 'all' || job.location === selectedLocation;
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        DEPARTMENTS.find(d => d.id === job.department)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDept && matchesLoc && matchesSearch;
    });
  }, [selectedDepartment, selectedLocation, searchTerm]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleApply = useCallback((jobTitle) => {
    toast.success(`Application started for: ${jobTitle}`, { icon: '📨' });
    // In production: navigate to application form or open modal
  }, []);

  const handleGeneralApply = useCallback(() => {
    toast.success('General application submitted!', { icon: '📨' });
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto mb-16"
          >
            <Badge variant="primary" className="mb-4">Join Our Team</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Help Us Build the Future of <span className="gradient-text">Career Success</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Join a passionate team on a mission to help millions of job seekers land their dream jobs.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
            <StatCard icon={FiUsers} value="50+" label="Team Members" />
            <StatCard icon={FiGlobe} value="15+" label="Countries" />
            <StatCard icon={FiStar} value="4.9" label="Glassdoor Rating" />
            <StatCard icon={FiAward} value="Top 10" label="Best Places to Work" />
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">Our Values</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12">The principles that guide everything we do</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((value, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Find your next opportunity</p>

            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search jobs..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={<FiFilter />}>
                  Filters {showFilters ? '▲' : '▼'}
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Department</label>
                        <div className="flex flex-wrap gap-2">
                          {DEPARTMENTS.map(dept => (
                            <button key={dept.id} onClick={() => setSelectedDepartment(dept.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                selectedDepartment === dept.id ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100'
                              }`}>{dept.name}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <div className="flex flex-wrap gap-2">
                          {LOCATIONS.map(loc => (
                            <button key={loc.id} onClick={() => setSelectedLocation(loc.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                selectedLocation === loc.id ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100'
                              }`}>{loc.name}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Job Cards */}
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                      <div onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                              <span><FiBriefcase className="w-4 h-4 inline mr-1" />{DEPARTMENTS.find(d => d.id === job.department)?.name}</span>
                              <span><FiMapPin className="w-4 h-4 inline mr-1" />{LOCATIONS.find(l => l.id === job.location)?.name}</span>
                              <span><FiClock className="w-4 h-4 inline mr-1" />{job.type}</span>
                              <span><FiCalendar className="w-4 h-4 inline mr-1" />{job.posted}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="primary">{job.experience}</Badge>
                            {expandedJob === job.id ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedJob === job.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-700 dark:text-gray-300 mb-6">{job.description}</p>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-3"><FiCheckCircle className="w-4 h-4 inline text-green-500 mr-1" />Requirements</h4>
                                <ul className="space-y-2">
                                  {job.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-primary-500 mt-1">•</span>{req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-3"><FiStar className="w-4 h-4 inline text-yellow-500 mr-1" />Nice to Have</h4>
                                <ul className="space-y-2">
                                  {job.niceToHave.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-primary-500 mt-1">•</span>{item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="mt-6">
                              <h4 className="font-semibold mb-3"><FiGift className="w-4 h-4 inline text-purple-500 mr-1" />Benefits</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.benefits.map((b, i) => <Badge key={i} variant="secondary">{b}</Badge>)}
                              </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400"><FiDollarSign className="w-4 h-4 inline mr-1" />{job.salary}</span>
                              <Button onClick={() => handleApply(job.title)} icon={<FiArrowRight />}>Apply Now</Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FiBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                  <p className="text-gray-500">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Perks */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">Why Work With Us</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12">We take care of our team</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PERKS.map((perk, index) => (
                <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0">
                      <perk.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{perk.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{perk.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} className="text-center max-w-3xl mx-auto">
            <Card className="p-12 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Don't See a Perfect Fit?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're always looking for talented people. Send us your resume and we'll keep you in mind.
              </p>
              <Button size="lg" onClick={handleGeneralApply} icon={<FiMessageCircle />}>Submit General Application</Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Careers;