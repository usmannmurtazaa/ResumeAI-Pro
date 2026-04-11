import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCheck, FiSearch } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { suggestKeywords } from '../../utils/atsKeywords';

const KeywordSuggestions = ({ industry, currentSkills, onAddSkill }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [addedSkills, setAddedSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(industry || 'technology');

  useEffect(() => {
    loadSuggestions();
  }, [selectedIndustry, currentSkills]);

  const loadSuggestions = () => {
    const suggested = suggestKeywords(selectedIndustry, currentSkills);
    setSuggestions(suggested);
  };

  const handleAddSkill = (skill) => {
    onAddSkill?.(skill);
    setAddedSkills(prev => [...prev, skill]);
    setSuggestions(prev => prev.filter(s => s !== skill));
  };

  const filteredSuggestions = suggestions.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const industries = [
    'technology', 'marketing', 'finance', 
    'healthcare', 'sales', 'education',
    'engineering', 'design', 'consulting'
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">ATS Keyword Suggestions</h3>

      {/* Industry Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Industry</label>
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
        >
          {industries.map(ind => (
            <option key={ind} value={ind} className="capitalize">
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
        />
      </div>

      {/* Added Skills */}
      {addedSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Added Keywords</p>
          <div className="flex flex-wrap gap-2">
            {addedSkills.map((skill, index) => (
              <Badge key={index} variant="success">
                {skill} <FiCheck className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <p className="text-sm font-medium mb-2">
          Recommended Keywords ({filteredSuggestions.length})
        </p>
        <div className="max-h-64 overflow-y-auto space-y-2">
          <AnimatePresence>
            {filteredSuggestions.map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="text-sm">{skill}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddSkill(skill)}
                  icon={<FiPlus />}
                >
                  Add
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        onClick={loadSuggestions}
        className="w-full mt-4"
      >
        Refresh Suggestions
      </Button>
    </Card>
  );
};

export default KeywordSuggestions;