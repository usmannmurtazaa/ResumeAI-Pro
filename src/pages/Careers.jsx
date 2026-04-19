import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBriefcase, FiMapPin, FiClock, FiUsers, FiHeart,
  FiCoffee, FiZap, FiGlobe, FiGift, FiTrendingUp,
  FiCalendar, FiDollarSign, FiArrowRight, FiSearch,
  FiFilter, FiChevronDown, FiChevronUp, FiCheckCircle,
  FiStar, FiAward, FiShield, FiTarget, FiCode,
  FiSmartphone, FiMonitor, FiLayers, FiMessageCircle
} from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Careers = () => {
  useDocumentTitle('Careers - Join Our Team | ResumeAI Pro');
  
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const departments = [
    { id: 'all', name: 'All Departments', icon: FiLayers },
    { id: 'engineering', name: 'Engineering', icon: FiCode },
    { id: 'product', name: 'Product', icon: FiTarget },
    { id: 'design', name: 'Design', icon: FiMonitor },
    { id: 'marketing', name: 'Marketing', icon: FiTrendingUp },
    { id: 'sales', name: 'Sales', icon: FiBriefcase },
    { id: 'customer-success', name: 'Customer Success', icon: FiHeart }
  ];

  const locations = [
    { id: 'all', name: 'All Locations' },
    { id: 'remote', name: 'Remote' },
    { id: 'san-francisco', name: 'San Francisco, CA' },
    { id: 'new-york', name: 'New York, NY' },
    { id: 'london', name: 'London, UK' },
    { id: 'berlin', name: 'Berlin, Germany' },
    { id: 'singapore', name: 'Singapore' }
  ];

  const jobListings = [
    {
      id: 1,
      title: 'Senior Full-Stack Engineer',
      department: 'engineering',
      location: 'remote',
      type: 'Full-time',
      experience: '5+ years',
      salary: '$140k - $180k',
      posted: '2 days ago',
      description: 'We are looking for a Senior Full-Stack Engineer to join our engineering team. You will be responsible for building and scaling our resume builder platform, working with React, Node.js, and Firebase.',
      requirements: [
        '5+ years of experience in full-stack development',
        'Expertise in React, Node.js, and TypeScript',
        'Experience with Firebase and cloud architecture',
        'Strong understanding of web performance and SEO',
        'Excellent problem-solving and communication skills'
      ],
      niceToHave: [
        'Experience with AI/ML technologies',
        'Contributions to open-source projects',
        'Experience with ATS systems',
        'Knowledge of PDF generation libraries'
      ],
      benefits: [
        'Competitive salary and equity',
        'Remote-first culture',
        'Health, dental, and vision insurance',
        '401(k) matching',
        'Unlimited PTO',
        'Home office stipend',
        'Learning and development budget'
      ]
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
      description: 'We are seeking a Product Manager to drive the vision and execution of our resume builder platform. You will work closely with engineering, design, and marketing teams.',
      requirements: [
        '3+ years of product management experience',
        'Strong analytical and data-driven decision making',
        'Experience with SaaS products',
        'Excellent communication and stakeholder management',
        'Technical background preferred'
      ],
      niceToHave: [
        'Experience in HR tech or career platforms',
        'MBA or advanced degree',
        'Experience with agile methodologies',
        'UI/UX sensibility'
      ],
      benefits: [
        'Competitive salary and equity',
        'Hybrid work model',
        'Comprehensive health benefits',
        '401(k) matching',
        'Flexible PTO',
        'Commuter benefits',
        'Gym membership reimbursement'
      ]
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
      description: 'We are looking for a Senior Product Designer to create beautiful, intuitive experiences for our users. You will own the design process from research to implementation.',
      requirements: [
        '4+ years of product design experience',
        'Strong portfolio demonstrating UI/UX expertise',
        'Proficiency in Figma and design systems',
        'Experience conducting user research',
        'Understanding of accessibility standards'
      ],
      niceToHave: [
        'Experience designing for B2B SaaS',
        'Motion design skills',
        'Front-end development knowledge',
        'Experience with design tokens'
      ],
      benefits: [
        'Competitive salary and equity',
        'Remote-first culture',
        'Health, dental, and vision insurance',
        '401(k) matching',
        'Unlimited PTO',
        'Design tool stipend',
        'Conference attendance budget'
      ]
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
      description: 'Join our AI team to build intelligent features that help users optimize their resumes. You will work on NLP, recommendation systems, and content generation.',
      requirements: [
        '3+ years of experience in AI/ML engineering',
        'Strong Python and ML framework skills',
        'Experience with NLP and LLMs',
        'Understanding of recommendation systems',
        'MS or PhD in CS, AI, or related field'
      ],
      niceToHave: [
        'Publications in AI/ML conferences',
        'Experience with OpenAI APIs',
        'Knowledge of vector databases',
        'Full-stack development experience'
      ],
      benefits: [
        'Competitive salary and equity',
        'Remote-first culture',
        'Comprehensive health benefits',
        '401(k) matching',
        'Unlimited PTO',
        'AI conference budget',
        'Research publication support'
      ]
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
      description: 'We are looking for a Technical Recruiter to help us grow our engineering and product teams. You will manage the full recruitment lifecycle.',
      requirements: [
        '2+ years of technical recruiting experience',
        'Strong sourcing and networking skills',
        'Experience with ATS and recruitment tools',
        'Excellent communication and negotiation skills'
      ],
      niceToHave: [
        'Experience recruiting for startups',
        'Technical background or education',
        'Experience with remote hiring',
        'Employer branding experience'
      ],
      benefits: [
        'Competitive hourly rate',
        'Remote work',
        'Flexible schedule',
        'Contract-to-hire potential'
      ]
    }
  ];

  const perks = [
    {
      icon: FiGlobe,
      title: 'Remote-First',
      description: 'Work from anywhere in the world. We believe in flexibility and trust.'
    },
    {
      icon: FiHeart,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision coverage for you and your family.'
    },
    {
      icon: FiTrendingUp,
      title: 'Growth & Development',
      description: 'Annual learning stipend, conference budgets, and mentorship programs.'
    },
    {
      icon: FiCalendar,
      title: 'Unlimited PTO',
      description: 'Take the time you need to recharge. We trust you to manage your time.'
    },
    {
      icon: FiCoffee,
      title: 'Home Office Setup',
      description: 'We provide a stipend to create your perfect workspace.'
    },
    {
      icon: FiGift,
      title: 'Equity Package',
      description: 'Every employee receives equity - we succeed together.'
    }
  ];

  const values = [
    {
      icon: FiTarget,
      title: 'User-First',
      description: 'Every decision starts with our users. We are obsessed with helping job seekers succeed.'
    },
    {
      icon: FiZap,
      title: 'Move Fast',
      description: 'We value speed and iteration. Perfect is the enemy of good.'
    },
    {
      icon: FiUsers,
      title: 'Collaborative',
      description: 'Great ideas come from everywhere. We work together across teams.'
    },
    {
      icon: FiShield,
      title: 'Integrity',
      description: 'We do the right thing, even when no one is watching.'
    }
  ];

  const filteredJobs = jobListings.filter(job => {
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchesLocation = selectedLocation === 'all' || job.location === selectedLocation;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDepartment && matchesLocation && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <Badge variant="primary" className="mb-4">Join Our Team</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Help Us Build the Future of{' '}
              <span className="gradient-text">Career Success</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Join a passionate team on a mission to help millions of job seekers land their dream jobs.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16"
          >
            <StatCard icon={FiUsers} value="50+" label="Team Members" />
            <StatCard icon={FiGlobe} value="15+" label="Countries" />
            <StatCard icon={FiStar} value="4.9" label="Glassdoor Rating" />
            <StatCard icon={FiAward} value="Top 10" label="Best Places to Work" />
          </motion.div>

          {/* Values Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-4">Our Values</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
              The principles that guide everything we do
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Job Listings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Find your next opportunity and make an impact
            </p>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<FiFilter />}
                  className="md:w-auto"
                >
                  Filters
                </Button>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Department</label>
                        <div className="flex flex-wrap gap-2">
                          {departments.map(dept => (
                            <button
                              key={dept.id}
                              onClick={() => setSelectedDepartment(dept.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                selectedDepartment === dept.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {dept.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <div className="flex flex-wrap gap-2">
                          {locations.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => setSelectedLocation(loc.id)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                selectedLocation === loc.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {loc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Jobs List */}
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout
                  >
                    <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                      <div onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FiBriefcase className="w-4 h-4" />
                                {departments.find(d => d.id === job.department)?.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiMapPin className="w-4 h-4" />
                                {locations.find(l => l.id === job.location)?.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiClock className="w-4 h-4" />
                                {job.type}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiCalendar className="w-4 h-4" />
                                {job.posted}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="primary">{job.experience}</Badge>
                            {expandedJob === job.id ? (
                              <FiChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <FiChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedJob === job.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                          >
                            <p className="text-gray-700 dark:text-gray-300 mb-6">{job.description}</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                                  Requirements
                                </h4>
                                <ul className="space-y-2">
                                  {job.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-primary-500 mt-1">•</span>
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <FiStar className="w-4 h-4 text-yellow-500" />
                                  Nice to Have
                                </h4>
                                <ul className="space-y-2">
                                  {job.niceToHave.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-primary-500 mt-1">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="mt-6">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <FiGift className="w-4 h-4 text-purple-500" />
                                Benefits
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {job.benefits.map((benefit, i) => (
                                  <Badge key={i} variant="secondary">{benefit}</Badge>
                                ))}
                              </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <FiDollarSign className="w-4 h-4" />
                                <span>{job.salary}</span>
                              </div>
                              <Button icon={<FiArrowRight />}>
                                Apply Now
                              </Button>
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
          </motion.div>

          {/* Perks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-4">Why Work With Us</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
              We take care of our team so they can do their best work
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk, index) => (
                <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
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
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Card className="p-12 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Don't See a Perfect Fit?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Button size="lg" icon={<FiMessageCircle />}>
                Submit General Application
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ icon: Icon, value, label }) => (
  <Card className="p-6 text-center">
    <Icon className="w-8 h-8 mx-auto mb-3 text-primary-500" />
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-gray-600 dark:text-gray-400">{label}</div>
  </Card>
);

export default Careers;