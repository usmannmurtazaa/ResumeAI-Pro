import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const Education = ({ data, onChange }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { education: data || [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education'
  });

  const onSubmit = (formData) => {
    onChange(formData.education);
  };

  const addEducation = () => {
    append({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      achievements: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Education</h3>
        <Button
          type="button"
          variant="outline"
          onClick={addEducation}
          icon={<FiPlus />}
        >
          Add Education
        </Button>
      </div>

      <form onChange={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="relative p-6 glass rounded-xl space-y-4">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <FiTrash2 />
            </button>

            <Input
              label="Institution"
              {...register(`education.${index}.institution`, { required: 'Institution is required' })}
              error={errors.education?.[index]?.institution?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Degree"
                {...register(`education.${index}.degree`, { required: 'Degree is required' })}
                error={errors.education?.[index]?.degree?.message}
              />
              
              <Input
                label="Field of Study"
                {...register(`education.${index}.field`)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                icon={<FiCalendar />}
                {...register(`education.${index}.startDate`)}
              />
              
              <Input
                label="End Date"
                type="date"
                icon={<FiCalendar />}
                {...register(`education.${index}.endDate`)}
              />
            </div>

            <Input
              label="GPA (Optional)"
              {...register(`education.${index}.gpa`)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Achievements & Activities
              </label>
              <textarea
                {...register(`education.${index}.achievements`)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                placeholder="List any honors, awards, or activities..."
              />
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No education added yet. Click "Add Education" to get started.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Education;