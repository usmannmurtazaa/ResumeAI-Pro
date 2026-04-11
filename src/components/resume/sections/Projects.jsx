import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const Projects = ({ data, onChange }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { projects: data || [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'projects'
  });

  const onSubmit = (formData) => {
    onChange(formData.projects);
  };

  const addProject = () => {
    append({
      name: '',
      description: '',
      technologies: '',
      link: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Projects</h3>
        <Button
          type="button"
          variant="outline"
          onClick={addProject}
          icon={<FiPlus />}
        >
          Add Project
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
              label="Project Name"
              {...register(`projects.${index}.name`, { required: 'Project name is required' })}
              error={errors.projects?.[index]?.name?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register(`projects.${index}.description`, { required: 'Description is required' })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                placeholder="Describe the project, your role, and the outcomes..."
              />
              {errors.projects?.[index]?.description && (
                <p className="text-sm text-red-500 mt-1">{errors.projects[index].description.message}</p>
              )}
            </div>

            <Input
              label="Technologies Used"
              {...register(`projects.${index}.technologies`)}
              placeholder="e.g., React, Node.js, Python, AWS"
            />

            <Input
              label="Project Link (Optional)"
              icon={<FiLink />}
              {...register(`projects.${index}.link`)}
              placeholder="https://github.com/..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="month"
                {...register(`projects.${index}.startDate`)}
              />
              
              <Input
                label="End Date"
                type="month"
                {...register(`projects.${index}.endDate`)}
              />
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No projects added yet. Click "Add Project" to get started.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Projects;