import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiDownload, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Home = () => {
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Create Your{' '}
              <span className="gradient-text">
                ATS-Optimized Resume
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Build professional resumes that get past applicant tracking systems and land more interviews
            </p>
            
            {user ? (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/signup')}
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
              </div>
            )}
          </motion.div>

          {/* Preview Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16"
          >
            <Card className="max-w-4xl mx-auto p-2">
              <div className="bg-gradient-to-br from-primary-500 to-accent-500 h-64 md:h-96 rounded-lg flex items-center justify-center text-white text-2xl">
                Resume Preview
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need to{' '}
            <span className="gradient-text">Succeed</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full">
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

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-12 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of professionals who've improved their resumes with our ATS-optimized builder
            </p>
            <Button
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              {user ? 'Create Resume' : 'Get Started Now'}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;