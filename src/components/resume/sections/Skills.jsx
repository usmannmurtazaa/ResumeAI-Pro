import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiX, FiSearch } from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { suggestKeywords } from '../../../utils/atsKeywords';

const Skills = ({ data, onChange }) => {
  const [newSkill, setNewSkill] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState('technology');
  
  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      technical: data?.technical || [],
      soft: data?.soft || [],
      languages: data?.languages || []
    }
  });

  const technicalSkills = watch('technical') || [];
  const softSkills = watch('soft') || [];
  const languages = watch('languages') || [];

  const onSubmit = (formData) => {
    onChange(formData);
  };

  const addSkill = (category) => {
    if (!newSkill.trim()) return;
    
    const currentSkills = watch(category) || [];
    if (!currentSkills.includes(newSkill.trim())) {
      setValue(category, [...currentSkills, newSkill.trim()]);
      handleSubmit(onSubmit)();
    }
    setNewSkill('');
  };

  const removeSkill = (category, skillToRemove) => {
    const currentSkills = watch(category) || [];
    setValue(category, currentSkills.filter(skill => skill !== skillToRemove));
    handleSubmit(onSubmit)();
  };

  const getSuggestions = () => {
    const currentSkills = technicalSkills;
    const suggested = suggestKeywords(selectedIndustry, currentSkills);
    setSuggestions(suggested);
  };

  const addSuggestion = (skill) => {
    if (!technicalSkills.includes(skill)) {
      setValue('technical', [...technicalSkills, skill]);
      handleSubmit(onSubmit)();
      setSuggestions(suggestions.filter(s => s !== skill));
    }
  };

  const SkillList = ({ title, skills, category }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 dark:text-gray-300">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(category, skill)}
              className="hover:text-red-500"
              aria-label={`Remove ${skill}`}
            >
              <FiX className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Skills</h3>
      
      <form onChange={handleSubmit(onSubmit)} className="space-y-6">
        {/* Technical Skills */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a technical skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('technical'))}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addSkill('technical')}
              icon={<FiPlus />}
            >
              Add
            </Button>
          </div>
          
          <SkillList title="Technical Skills" skills={technicalSkills} category="technical" />

          {/* ATS Suggestions */}
          <div className="p-4 glass rounded-xl">
            <div className="flex gap-2 mb-3">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50"
              >
                <option value="technology">Technology</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="sales">Sales</option>
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={getSuggestions}
                icon={<FiSearch />}
              >
                Get Suggestions
              </Button>
            </div>
            
            {suggestions.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Recommended skills for ATS optimization:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addSuggestion(skill)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg text-sm transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a soft skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('soft'))}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addSkill('soft')}
              icon={<FiPlus />}
            >
              Add
            </Button>
          </div>
          
          <SkillList title="Soft Skills" skills={softSkills} category="soft" />
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a language..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('languages'))}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addSkill('languages')}
              icon={<FiPlus />}
            >
              Add
            </Button>
          </div>
          
          <SkillList title="Languages" skills={languages} category="languages" />
        </div>
      </form>
    </div>
  );
};

export default Skills;