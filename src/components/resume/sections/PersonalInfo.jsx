import React from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLinkedin, FiGithub, FiGlobe } from 'react-icons/fi';
import Input from '../../ui/Input';

const PersonalInfo = ({ data, onChange }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: data
  });

  const onSubmit = (formData) => {
    onChange(formData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
      
      <form onChange={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            icon={<FiUser />}
            {...register('fullName', { required: 'Full name is required' })}
            error={errors.fullName?.message}
          />
          
          <Input
            label="Professional Title"
            icon={<FiUser />}
            {...register('title', { required: 'Professional title is required' })}
            error={errors.title?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            icon={<FiMail />}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email?.message}
          />
          
          <Input
            label="Phone"
            icon={<FiPhone />}
            {...register('phone', { required: 'Phone number is required' })}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Location"
            icon={<FiMapPin />}
            {...register('location')}
          />
          
          <Input
            label="Website/Portfolio"
            icon={<FiGlobe />}
            {...register('website')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="LinkedIn"
            icon={<FiLinkedin />}
            {...register('linkedin')}
          />
          
          <Input
            label="GitHub"
            icon={<FiGithub />}
            {...register('github')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Professional Summary
          </label>
          <textarea
            {...register('summary')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
            placeholder="Write a brief summary of your professional background..."
          />
        </div>
      </form>
    </div>
  );
};

export default PersonalInfo;