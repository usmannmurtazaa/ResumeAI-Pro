import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiCalendar, FiBriefcase } from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const Experience = ({ data, onChange }) => {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { experience: data || [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience'
  });

  const onSubmit = (formData) => {
    onChange(formData.experience);
  };

  const addExperience = () => {
    append({
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Work Experience</h3>
        <Button
          type="button"
          variant="outline"
          onClick={addExperience}
          icon={<FiPlus />}
        >
          Add Experience
        </Button>
      </div>

      <form onChange={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => {
          const isCurrent = watch(`experience.${index}.current`);
          
          return (
            <div key={field.id} className="relative p-6 glass rounded-xl space-y-4">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <FiTrash2 />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Job Title"
                  icon={<FiBriefcase />}
                  {...register(`experience.${index}.title`, { required: 'Job title is required' })}
                  error={errors.experience?.[index]?.title?.message}
                />
                
                <Input
                  label="Company"
                  {...register(`experience.${index}.company`, { required: 'Company is required' })}
                  error={errors.experience?.[index]?.company?.message}
                />
              </div>

              <Input
                label="Location"
                {...register(`experience.${index}.location`)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="month"
                  icon={<FiCalendar />}
                  {...register(`experience.${index}.startDate`, { required: 'Start date is required' })}
                  error={errors.experience?.[index]?.startDate?.message}
                />
                
                <Input
                  label="End Date"
                  type="month"
                  icon={<FiCalendar />}
                  disabled={isCurrent}
                  {...register(`experience.${index}.endDate`, {
                    required: !isCurrent && 'End date is required'
                  })}
                  error={errors.experience?.[index]?.endDate?.message}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`current-${index}`}
                  {...register(`experience.${index}.current`)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={`current-${index}`} className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  I currently work here
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description & Achievements
                </label>
                <textarea
                  {...register(`experience.${index}.description`, { required: 'Description is required' })}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="Describe your responsibilities and achievements. Use action verbs and include metrics when possible..."
                />
                {errors.experience?.[index]?.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.experience[index].description.message}</p>
                )}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-1">ATS Tip:</p>
                <p>Use action verbs like "Developed", "Implemented", "Led", "Achieved" and include quantifiable results (e.g., "Increased sales by 25%")</p>
              </div>
            </div>
          );
        })}

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No work experience added yet. Click "Add Experience" to get started.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Experience;