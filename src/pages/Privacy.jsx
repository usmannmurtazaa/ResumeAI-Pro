import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Card from '../components/ui/Card';

const Privacy = () => {
  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Privacy Policy</h1>
          
          <Card className="p-8 space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: January 15, 2024
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We collect information you provide directly to us, including your name, email address, 
                and resume content. We also collect usage data to improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use your information to provide, maintain, and improve our services, 
                communicate with you, and ensure the security of our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate security measures to protect your personal information. 
                Your data is encrypted and stored securely.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You have the right to access, correct, or delete your personal information. 
                Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@atsresume.com" className="text-primary-600">
                  privacy@atsresume.com
                </a>
              </p>
            </section>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;