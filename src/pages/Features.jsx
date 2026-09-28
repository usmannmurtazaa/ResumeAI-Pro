import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiTarget,
  FiLayout,
  FiDownload,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
  FiCpu,
  FiMessageCircle,
  FiEdit3,
} from 'react-icons/fi';
import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const FEATURES = [
  {
    id: 'ats-optimization',
    icon: FiTarget,
    title: 'ATS Optimization',
    description:
      'AI-powered keyword analysis and real-time ATS scoring to help your resume pass automated screening systems.',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Core',
    details: [
      'Real-time ATS compatibility scoring',
      'Industry-specific keyword suggestions',
      'Section completeness checker',
      'Action verb optimization',
      'Format compatibility validation',
    ],
  },
  {
    id: 'ai-suggestions',
    icon: FiCpu,
    title: 'AI-Powered Suggestions',
    description:
      'Smart content suggestions that improve the impact of your resume using AI-driven analysis.',
    color: 'from-purple-500 to-pink-500',
    badge: 'AI',
    details: [
      'Bullet point improvement suggestions',
      'Achievement quantification tips',
      'Professional summary generator',
      'Skills gap analysis',
      'Job description matching',
    ],
  },
  {
    id: 'templates',
    icon: FiLayout,
    title: 'Professional Templates',
    description:
      'ATS-friendly templates designed for clarity, readability, and recruiter-friendly formatting.',
    color: 'from-green-500 to-emerald-500',
    badge: 'Popular',
    details: [
      'Modern, Classic, Creative, Executive styles',
      'Customisable colours and fonts',
      'Section visibility controls',
      'Drag-and-drop reordering',
      'Live responsive preview',
    ],
  },
  {
    id: 'builder',
    icon: FiEdit3,
    title: 'Intuitive Builder',
    description:
      'A seamless resume-building experience with real-time preview, auto-save, and guided section completion.',
    color: 'from-orange-500 to-red-500',
    badge: 'New',
    details: [
      'Real-time live preview',
      'Auto-save as you type',
      'Guided section completion',
      'Drag-and-drop section editing',
      'Preview at multiple screen sizes',
    ],
  },
  {
    id: 'export',
    icon: FiDownload,
    title: 'Export & Share',
    description:
      'Download your resume as a print-ready PDF with formatting preserved for both digital submission and printing.',
    color: 'from-indigo-500 to-blue-600',
    badge: 'Essential',
    details: [
      'PDF export (print-optimized)',
      'Consistent formatting preserved',
      'ATS-parseable output',
      'Preview before download',
      'High-resolution output',
    ],
  },
  {
    id: 'analytics',
    icon: FiTrendingUp,
    title: 'Resume Analytics',
    description:
      'Track your ATS score over time and see how each change affects your resume\u2019s compatibility.',
    color: 'from-pink-500 to-rose-500',
    badge: 'Pro',
    details: [
      'ATS score history',
      'Improvement suggestions',
      'Section-by-section breakdown',
      'Keyword coverage tracking',
      'Progress overview',
    ],
  },
  {
    id: 'security',
    icon: FiShield,
    title: 'Privacy Focused',
    description:
      'Your resume data is encrypted in transit and never shared with third parties for advertising.',
    color: 'from-gray-600 to-gray-800',
    details: [
      'Encrypted in transit (HTTPS)',
      'Resume data kept private to your account',
      'Export your data anytime',
      'No third-party advertising trackers',
      'Granular account controls',
    ],
  },
  {
    id: 'support',
    icon: FiMessageCircle,
    title: 'Support',
    description:
      'Access to a comprehensive help center, video tutorials, and email support to help you get the most out of Maniesta Career OS.',
    color: 'from-teal-500 to-cyan-500',
    details: [
      'Help center with guides',
      'Video tutorials',
      'Email support',
      'FAQ with common questions',
      'Direct contact form',
    ],
  },
];

const COMPARISON_ROWS = [
  { feature: 'Resumes', free: '5', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'Templates', free: 'Basic', pro: 'All', business: 'All' },
  { feature: 'ATS Scoring', free: 'Basic', pro: 'Advanced', business: 'Advanced' },
  { feature: 'AI Suggestions', free: 'Limited', pro: 'Unlimited', business: 'Unlimited' },
  { feature: 'Export Formats', free: 'PDF', pro: 'PDF', business: 'PDF' },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', business: 'Advanced' },
  { feature: 'Support', free: 'Email', pro: 'Priority Email', business: 'Dedicated Support' },
  { feature: 'Team Management', free: '-', pro: '-', business: 'Included' },
  { feature: 'Price', free: 'Free', pro: '$19.99/mo', business: '$49.99/mo' },
];

// ── Sub-Components ────────────────────────────────────────────────────────

const FeatureCard = React.memo(({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -4 }}
  >
    <Card className="p-6 h-full group">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <feature.icon className="w-6 h-6 text-white" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-semibold">{feature.title}</h3>
        {feature.badge && (
          <Badge
            variant={
              feature.badge === 'Pro' ? 'warning' : feature.badge === 'AI' ? 'primary' : 'secondary'
            }
            size="sm"
          >
            {feature.badge}
          </Badge>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
        {feature.description}
      </p>

      <ul className="space-y-1.5">
        {feature.details.map((detail, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  </motion.div>
));

FeatureCard.displayName = 'FeatureCard';

// ── Main Component ────────────────────────────────────────────────────────

const Features = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <Badge variant="primary" className="mb-4">
              Powerful Features
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Everything You Need to <span className="gradient-text">Land the Job</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              From AI-powered writing to ATS optimization, Maniesta Career OS gives you all the tools to
              create a standout resume.
            </p>
          </motion.div>

          {/* Feature highlights - replaces the fabricated stats block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20">
            {[
              { icon: FiTarget, label: 'ATS-Optimized', color: 'text-blue-500' },
              { icon: FiCpu, label: 'AI-Powered', color: 'text-purple-500' },
              { icon: FiDownload, label: 'Instant Export', color: 'text-green-500' },
              { icon: FiShield, label: 'Privacy Focused', color: 'text-teal-500' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <item.icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-4xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold mb-4">Plan Comparison</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose the plan that fits your needs
              </p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-6 font-semibold">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold">
                      <span className="text-gray-600 dark:text-gray-400">Free</span>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold">
                      <span className="gradient-text">Pro</span>
                      <Badge variant="warning" size="sm" className="ml-2">
                        Recommended
                      </Badge>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">Business</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-4 px-6 text-sm font-medium">{row.feature}</td>
                      <td className="py-4 px-6 text-sm text-center text-gray-600 dark:text-gray-400">
                        {row.free}
                      </td>
                      <td className="py-4 px-6 text-sm text-center font-medium text-primary-600 dark:text-primary-400">
                        {row.pro}
                      </td>
                      <td className="py-4 px-6 text-sm text-center text-gray-600 dark:text-gray-400">
                        {row.business}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Card className="p-10 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Build Your Resume?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start building your ATS-optimised resume today. Free to try, no credit card
                required.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="group">
                    Get Started Free
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Features;
