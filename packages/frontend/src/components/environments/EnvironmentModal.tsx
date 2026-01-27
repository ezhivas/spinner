import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '@/components/common';
import { useEnvironmentsStore, useToastStore } from '@/store';
import type { IEnvironment } from '@shared/environments';

const environmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

type EnvironmentFormData = z.infer<typeof environmentSchema>;

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  environment?: IEnvironment | null;
}

/**
 * Модальное окно для создания/редактирования окружения
 */
export const EnvironmentModal = ({ isOpen, onClose, environment }: EnvironmentModalProps) => {
  const { createEnvironment, updateEnvironment, loading } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();

  const [variables, setVariables] = useState<Array<{ key: string; value: string }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnvironmentFormData>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      name: environment?.name || '',
    },
  });

  // Инициализация переменных при открытии
  useEffect(() => {
    if (isOpen) {
      reset({ name: environment?.name || '' });

      if (environment?.variables) {
        const vars = Object.entries(environment.variables).map(([key, value]) => ({
          key,
          value,
        }));
        setVariables(vars.length > 0 ? vars : [{ key: '', value: '' }]);
      } else {
        setVariables([{ key: '', value: '' }]);
      }
    }
  }, [isOpen, environment, reset]);

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '' }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: 'key' | 'value', val: string) => {
    const newVars = [...variables];
    newVars[index][field] = val;
    setVariables(newVars);
  };

  const onSubmit = async (data: EnvironmentFormData) => {
    try {
      // Преобразовать массив переменных в объект
      const varsObject = variables.reduce((acc, { key, value }) => {
        if (key.trim()) {
          acc[key.trim()] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      if (environment) {
        await updateEnvironment(environment.id, data.name, varsObject);
        success('Environment updated successfully');
      } else {
        await createEnvironment(data.name, varsObject);
        success('Environment created successfully');
      }
      onClose();
      reset();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save environment');
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setVariables([{ key: '', value: '' }]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={environment ? 'Edit Environment' : 'New Environment'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="Production, Staging, etc."
          error={errors.name?.message}
          required
          {...register('name')}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Variables
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addVariable}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Variable
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {variables.map((variable, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="value"
                    value={variable.value}
                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariable(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  disabled={variables.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Use variables in requests as: <code className="bg-gray-100 px-1 rounded">{'{{KEY}}'}</code>
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {environment ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
