import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';

const Terms = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Terms of Service</h1>
          
          <Card className="p-8 space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: January 15, 2024
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using ATS Resume Builder, you agree to be bound by these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You are responsible for maintaining the security of your account credentials and 
                for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Content Ownership</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You retain ownership of all content you create using our platform. We claim no 
                intellectual property rights over your resume content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You agree not to use our service for any unlawful purpose or in any way that 
                could damage or impair our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Termination</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to suspend or terminate your account for violations of these terms.
              </p>
            </section>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Terms;