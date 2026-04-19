import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        '1 Resume',
        '3 Basic Templates',
        'PDF Download',
        'Basic ATS Check',
        'Email Support'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
      popular: false
    },
    {
      name: 'Professional',
      price: '$9.99',
      period: '/month',
      description: 'For serious job seekers',
      features: [
        'Unlimited Resumes',
        'All Premium Templates',
        'Advanced ATS Optimization',
        'LinkedIn Import',
        'Cover Letter Builder',
        'Priority Email Support',
        'Resume Analytics',
        'Multiple Formats Export'
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$29.99',
      period: '/month',
      description: 'For teams and agencies',
      features: [
        'Everything in Professional',
        'Team Management',
        'Custom Templates',
        'API Access',
        'Dedicated Account Manager',
        'Phone Support',
        'Custom Branding',
        'Bulk Operations',
        'Advanced Analytics'
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline',
      popular: false
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent{' '}
              <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the perfect plan for your career journey. All plans include our core ATS optimization features.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative p-8 h-full ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-gray-500 mb-1">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.buttonVariant}
                    className="w-full"
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. No questions asked.'
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes, all paid plans come with a 14-day free trial. No credit card required.'
                },
                {
                  q: 'Are the templates ATS-friendly?',
                  a: 'Absolutely! All our templates are optimized to pass through Applicant Tracking Systems.'
                },
                {
                  q: 'Can I export to different formats?',
                  a: 'Yes, you can export your resume as PDF, DOCX, and plain text formats.'
                }
              ].map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Pricing;