import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiDownload, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Home = () => {
  useDocumentTitle('Home');
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: FiFileText,
      title: 'ATS-Optimized Templates',
      description: 'Professionally designed templates that pass applicant tracking systems'
    },
    {
      icon: FiCheckCircle,
      title: 'Smart Suggestions',
      description: 'Get keyword recommendations to improve your resume score'
    },
    {
      icon: FiDownload,
      title: 'Instant PDF Download',
      description: 'Export your resume as a professional PDF with one click'
    },
    {
      icon: FiTrendingUp,
      title: 'Resume Scoring',
      description: 'Real-time ATS score to optimize your resume'
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '85%', label: 'Interview Rate' },
    { value: '20+', label: 'Templates' },
    { value: '4.9', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-primary-900/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 dark:bg-accent-900/20 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Create Your{' '}
                  <span className="gradient-text">
                    ATS-Optimized Resume
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
                  Build professional resumes that get past applicant tracking systems and land more interviews.
                </p>

                <div className="flex flex-wrap gap-4">
                  {user ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/dashboard')}
                      icon={<FiArrowRight />}
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => navigate('/signup')}
                        icon={<FiArrowRight />}
                      >
                        Get Started Free
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/login')}
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Content - Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-2 shadow-2xl">
                  <div className="bg-gradient-to-br from-primary-500 to-accent-500 h-64 md:h-80 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 text-center text-white">
                      <FiFileText className="w-16 h-16 mx-auto mb-4 opacity-90" />
                      <p className="text-xl font-semibold mb-2">Resume Preview</p>
                      <p className="text-sm opacity-80">Professional ATS-Friendly Design</p>
                    </div>
                    {/* Animated lines */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="h-1 w-24 bg-white/30 rounded-full mx-auto mb-4"></div>
                      <div className="h-1 w-32 bg-white/20 rounded-full mx-auto mb-4"></div>
                      <div className="h-1 w-28 bg-white/20 rounded-full mx-auto mb-4"></div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to{' '}
                <span className="gradient-text">Succeed</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our platform provides all the tools you need to create a standout resume
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center h-full hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-white" />
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
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It{' '}
                <span className="gradient-text">Works</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create your professional resume in three simple steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '01', title: 'Choose Template', desc: 'Select from our collection of ATS-optimized templates' },
                { step: '02', title: 'Fill Details', desc: 'Add your experience, skills, and education' },
                { step: '03', title: 'Download & Apply', desc: 'Export as PDF and start applying to jobs' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-5xl font-bold gradient-text mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
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
              className="glass-card p-12 max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Land Your Dream Job?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of professionals who've improved their resumes with our ATS-optimized builder.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate('/signup')}
                    >
                      Get Started Now
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
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;