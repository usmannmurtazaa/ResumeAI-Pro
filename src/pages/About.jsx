import React from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';

const About = () => {
  const stats = [
    { icon: FiUsers, value: '50K+', label: 'Active Users' },
    { icon: FiTarget, value: '85%', label: 'Interview Rate' },
    { icon: FiAward, value: '100+', label: 'Templates' },
    { icon: FiTrendingUp, value: '95%', label: 'ATS Pass Rate' }
  ];

  const team = [
    { name: 'Usman Murtaza', role: 'CEO & Founder', image: '👨‍💼' },
    { name: 'Jane Smith', role: 'Head of Product', image: '👩‍💼' },
    { name: 'Mike Johnson', role: 'Tech Lead', image: '👨‍💻' },
    { name: 'Sarah Williams', role: 'Design Lead', image: '👩‍🎨' }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About{' '}
              <span className="gradient-text">ATS Resume Builder</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We're on a mission to help job seekers land their dream jobs with professional, 
              ATS-optimized resumes.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-500" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Story Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Founded in 2026, ATS Resume Builder was created out of a simple observation: 
                qualified candidates were being filtered out by Applicant Tracking Systems 
                before a human ever saw their resume.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Today, we've helped over 50,000 job seekers create ATS-optimized resumes that 
                get them noticed. Our platform combines professional design with intelligent 
                optimization to ensure your resume stands out to both algorithms and hiring managers.
              </p>
            </Card>
          </div>

          {/* Team Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl">
                      {member.image}
                    </div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;