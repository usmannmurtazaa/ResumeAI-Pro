import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import Card from '../ui/Card';

const templates = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with a professional touch',
    color: 'from-blue-500 to-cyan-500',
    preview: '🎨'
  },
  {
    id: 'classic',
    name: 'Classic Executive',
    description: 'Traditional format ideal for senior positions',
    color: 'from-gray-600 to-gray-800',
    preview: '📄'
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Stand out with a unique and creative layout',
    color: 'from-purple-500 to-pink-500',
    preview: '✨'
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Simple and elegant with focus on content',
    color: 'from-green-500 to-emerald-500',
    preview: '◻️'
  }
];

const TemplateSelector = ({ selected, onSelect }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Choose Template</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`p-4 cursor-pointer relative overflow-hidden ${
                selected === template.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => onSelect(template.id)}
            >
              {selected === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <FiCheck className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${template.color} mb-4 flex items-center justify-center text-4xl`}>
                {template.preview}
              </div>
              
              <h4 className="font-semibold mb-1">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;