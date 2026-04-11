import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiCalendar, FiAward } from 'react-icons/fi';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

const Certifications = ({ data, onChange }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { certifications: data || [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'certifications'
  });

  const onSubmit = (formData) => {
    onChange(formData.certifications);
  };

  const addCertification = () => {
    append({
      name: '',
      issuer: '',
      date: '',
      credentialId: '',
      link: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Certifications</h3>
        <Button
          type="button"
          variant="outline"
          onClick={addCertification}
          icon={<FiPlus />}
        >
          Add Certification
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Certification Name"
                icon={<FiAward />}
                {...register(`certifications.${index}.name`, { required: 'Certification name is required' })}
                error={errors.certifications?.[index]?.name?.message}
              />
              
              <Input
                label="Issuing Organization"
                {...register(`certifications.${index}.issuer`, { required: 'Issuing organization is required' })}
                error={errors.certifications?.[index]?.issuer?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Issue Date"
                type="month"
                icon={<FiCalendar />}
                {...register(`certifications.${index}.date`)}
              />
              
              <Input
                label="Credential ID (Optional)"
                {...register(`certifications.${index}.credentialId`)}
              />
            </div>

            <Input
              label="Credential URL (Optional)"
              {...register(`certifications.${index}.link`)}
              placeholder="https://..."
            />
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No certifications added yet. Click "Add Certification" to get started.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default Certifications;