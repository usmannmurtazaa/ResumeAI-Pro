import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiGlobe, FiHeart } from 'react-icons/fi';
import { siteConfig } from '../../config/siteConfig';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">ResumeAi Pro</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AI-powered resume builder that helps you create ATS-optimized resumes and land your dream job.
            </p>
            <div className="flex gap-3">
              <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FiGithub className="w-4 h-4" />
              </a>
              <a href={siteConfig.links.twitter} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href={siteConfig.authorLinks.linkedin} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <FiLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/templates" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Templates</Link></li>
              <li><Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Pricing</Link></li>
              <li><Link to="/ats-scanner" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">ATS Scanner</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">About</Link></li>
              <li><Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Blog</Link></li>
              <li><Link to="/careers" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-primary-600">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Credit */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {currentYear} ResumeAi Pro. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Created with</span>
              <FiHeart className="w-4 h-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">by</span>
              <a 
                href={siteConfig.authorLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
              >
                Usman Murtaza
                <FiGlobe className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;