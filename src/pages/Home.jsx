import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiDownload, 
  FiTrendingUp, 
  FiArrowRight,
  FiStar,
  FiUsers,
  FiAward,
  FiZap,
  FiShield,
  FiTarget,
  FiLayout,
  FiSearch,
  FiBriefcase,
  FiClock,
  FiThumbsUp,
  FiBarChart2,
  FiGlobe,
  FiPlay,
  FiPause,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

const Home = () => {
  useDocumentTitle('ATS Resume Builder - Create Professional Resumes');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    resumes: 0,
    rating: 0,
    templates: 0
  });

  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Animate stats on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => ({
        users: Math.min(prev.users + 234, 50000),
        resumes: Math.min(prev.resumes + 567, 100000),
        rating: 4.9,
        templates: Math.min(prev.templates + 1, 25)
      }));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: FiTarget,
      title: 'ATS-Optimized Templates',
      description: 'Professionally designed templates that pass applicant tracking systems with flying colors',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FiZap,
      title: 'AI Smart Suggestions',
      description: 'Get real-time keyword recommendations to boost your resume score',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FiDownload,
      title: 'Instant PDF Export',
      description: 'Download your resume as a professional, print-ready PDF with one click',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FiBarChart2,
      title: 'Resume Scoring',
      description: 'Track your ATS compatibility score and get actionable improvement tips',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: FiLayout,
      title: '20+ Premium Templates',
      description: 'Choose from a wide variety of modern and classic resume designs',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: FiShield,
      title: 'Privacy First',
      description: 'Your data is encrypted and never shared with third parties',
      color: 'from-teal-500 to-green-500'
    }
  ];

  const stats = [
    { 
      value: animatedStats.users, 
      label: 'Active Users', 
      suffix: 'K+',
      icon: FiUsers,
      color: 'text-blue-500'
    },
    { 
      value: 85, 
      label: 'Interview Success Rate', 
      suffix: '%',
      icon: FiTrendingUp,
      color: 'text-green-500'
    },
    { 
      value: animatedStats.templates, 
      label: 'Premium Templates', 
      suffix: '+',
      icon: FiLayout,
      color: 'text-purple-500'
    },
    { 
      value: animatedStats.rating, 
      label: 'User Rating', 
      suffix: '/5.0',
      icon: FiStar,
      color: 'text-yellow-500'
    }
  ];

  const testimonials = [
    {
      text: "ResumeAi Pro transformed my job search. Within two weeks of using their ATS-optimized resume, I landed interviews at three Fortune 500 companies!",
      author: "Sarah Chen",
      role: "Software Engineer at Google",
      avatar: "SC",
      rating: 5
    },
    {
      text: "The AI suggestions are incredible. My resume score went from 45% to 92% in just 30 minutes. This tool is a game-changer for job seekers.",
      author: "Michael Rodriguez",
      role: "Product Manager at Microsoft",
      avatar: "MR",
      rating: 5
    },
    {
      text: "I've tried many resume builders, but ResumeAi Pro is by far the best. The templates are beautiful and truly ATS-friendly. Highly recommended!",
      author: "Emily Watson",
      role: "Marketing Director at Amazon",
      avatar: "EW",
      rating: 5
    }
  ];

  const trustedBy = [
    { name: 'Google', logo: 'G' },
    { name: 'Microsoft', logo: 'M' },
    { name: 'Amazon', logo: 'A' },
    { name: 'Meta', logo: 'M' },
    { name: 'Apple', logo: 'A' },
    { name: 'Netflix', logo: 'N' }
  ];

  const currentTestimonialData = testimonials[currentTestimonial];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 pb-20 px-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200/20 dark:bg-purple-900/20 rounded-full blur-3xl animate-pulse delay-500" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="container mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Trust Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-6"
                >
                  <FiAward className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    Trusted by 50,000+ professionals
                  </span>
                </motion.div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Create Your{' '}
                  <span className="gradient-text">
                    ATS-Optimized Resume
                  </span>
                  {' '}in Minutes
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                  Build professional resumes that get past applicant tracking systems and land 3x more interviews.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  {user ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/dashboard')}
                      icon={<FiArrowRight />}
                      className="group"
                    >
                      Go to Dashboard
                      <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => navigate('/signup')}
                        className="group bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                      >
                        Get Started Free
                        <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/templates')}
                      >
                        View Templates
                      </Button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="group"
                    >
                      <div className={`flex items-center gap-2 mb-1 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {typeof stat.value === 'number' && stat.value > 1000 
                            ? `${(stat.value / 1000).toFixed(0)}${stat.suffix}`
                            : `${stat.value}${stat.suffix}`}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Content - Interactive Preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-2xl" />
                
                <Card className="relative p-2 shadow-2xl overflow-hidden">
                  {/* Video/Preview Area */}
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 h-80 md:h-96 rounded-lg overflow-hidden">
                    {!isVideoPlaying ? (
                      <>
                        {/* Preview Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                          <FiFileText className="w-20 h-20 mb-4 opacity-90" />
                          <h3 className="text-2xl font-bold mb-2">Resume Preview</h3>
                          <p className="text-sm opacity-80 mb-6">Professional ATS-Friendly Design</p>
                          
                          {/* Play Button */}
                          <button
                            onClick={() => setIsVideoPlaying(true)}
                            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
                          >
                            <FiPlay className="w-6 h-6 text-white ml-1" />
                          </button>
                        </div>

                        {/* Animated Resume Lines */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="space-y-3">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '60%' }}
                              transition={{ delay: 0.5, duration: 0.8 }}
                              className="h-2 bg-white/30 rounded-full"
                            />
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '80%' }}
                              transition={{ delay: 0.7, duration: 0.8 }}
                              className="h-2 bg-white/20 rounded-full"
                            />
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '50%' }}
                              transition={{ delay: 0.9, duration: 0.8 }}
                              className="h-2 bg-white/20 rounded-full"
                            />
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '70%' }}
                              transition={{ delay: 1.1, duration: 0.8 }}
                              className="h-2 bg-white/20 rounded-full"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-black">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-white">Demo Video</p>
                        </div>
                        <button
                          onClick={() => setIsVideoPlaying(false)}
                          className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                        >
                          <FiPause className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Floating Badges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute -bottom-4 -left-4 glass-card px-4 py-2 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">ATS Score: 98%</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -top-4 -right-4 glass-card px-4 py-2 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">Premium Template</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"
              />
            </div>
          </motion.div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 px-4 border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto">
            <p className="text-center text-sm text-gray-500 uppercase tracking-wider mb-8">
              Trusted by professionals from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {trustedBy.map((company, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-2xl font-bold text-gray-400 dark:text-gray-600"
                >
                  {company.logo}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge variant="primary" className="mb-4">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to{' '}
                <span className="gradient-text">Succeed</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our platform provides all the tools you need to create a standout resume that gets results
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-6 h-full hover:shadow-xl transition-all group">
                    <div className={`w-14 h-14 mb-4 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="secondary" className="mb-4">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It{' '}
                <span className="gradient-text">Works</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create your professional resume in three simple steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { 
                  step: '01', 
                  title: 'Choose Template', 
                  desc: 'Select from our collection of 25+ ATS-optimized templates',
                  icon: FiLayout,
                  color: 'from-blue-500 to-cyan-500'
                },
                { 
                  step: '02', 
                  title: 'Fill Your Details', 
                  desc: 'Add your experience, skills, and education with AI-powered suggestions',
                  icon: FiFileText,
                  color: 'from-purple-500 to-pink-500'
                },
                { 
                  step: '03', 
                  title: 'Download & Apply', 
                  desc: 'Export as PDF and start applying to your dream jobs',
                  icon: FiDownload,
                  color: 'from-green-500 to-emerald-500'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative text-center"
                >
                  <Card className="p-6 h-full">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold gradient-text mb-2">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </Card>
                  
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-300 to-accent-300" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge variant="warning" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Our{' '}
                <span className="gradient-text">Users Say</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Join thousands of satisfied professionals who landed their dream jobs
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 md:p-10">
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-xl md:text-2xl text-center text-gray-700 dark:text-gray-300 italic mb-8">
                      "{currentTestimonialData.text}"
                    </p>
                    
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-semibold">
                        {currentTestimonialData.avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg">{currentTestimonialData.author}</p>
                        <p className="text-gray-500 dark:text-gray-400">{currentTestimonialData.role}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Testimonial Navigation */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentTestimonial(prev => prev === 0 ? testimonials.length - 1 : prev - 1)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentTestimonial
                          ? 'w-8 bg-primary-500'
                          : 'w-2 bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="glass-card p-12 max-w-4xl mx-auto bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Land Your{' '}
                <span className="gradient-text">Dream Job?</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join 50,000+ professionals who've improved their resumes and accelerated their careers with our ATS-optimized builder.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                    className="group"
                  >
                    Go to Dashboard
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate('/signup')}
                      className="group bg-gradient-to-r from-primary-500 to-accent-500"
                    >
                      Get Started Free
                      <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/templates')}
                    >
                      Browse Templates
                    </Button>
                  </>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                No credit card required • Free forever plan available
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;