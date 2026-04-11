import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FiEye, FiCheck } from 'react-icons/fi';

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean and contemporary design perfect for tech professionals',
      category: 'Professional',
      popularity: 'Most Popular',
      preview: '🎨'
    },
    {
      id: 'classic',
      name: 'Classic Executive',
      description: 'Traditional format ideal for senior management positions',
      category: 'Executive',
      preview: '📄'
    },
    {
      id: 'creative',
      name: 'Creative Portfolio',
      description: 'Stand out with a unique and artistic layout',
      category: 'Creative',
      preview: '✨'
    },
    {
      id: 'minimal',
      name: 'Minimalist',
      description: 'Simple and elegant with focus on content',
      category: 'Minimal',
      preview: '◻️'
    },
    {
      id: 'tech',
      name: 'Tech Startup',
      description: 'Modern design optimized for tech roles',
      category: 'Technology',
      preview: '💻'
    },
    {
      id: 'corporate',
      name: 'Corporate Pro',
      description: 'Professional design for corporate environments',
      category: 'Corporate',
      preview: '🏢'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Resume Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from our collection of ATS-optimized templates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 cursor-pointer transition-all ${
                selectedTemplate === template.id ? 'ring-2 ring-primary-500' : ''
              }`} onClick={() => setSelectedTemplate(template.id)}>
                {template.popularity && (
                  <Badge variant="primary" className="mb-3">
                    {template.popularity}
                  </Badge>
                )}
                
                <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-4 flex items-center justify-center text-5xl">
                  {template.preview}
                </div>
                
                <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="default">{template.category}</Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={<FiEye />}>
                      Preview
                    </Button>
                    {selectedTemplate === template.id && (
                      <Button size="sm" icon={<FiCheck />}>
                        Selected
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Templates;