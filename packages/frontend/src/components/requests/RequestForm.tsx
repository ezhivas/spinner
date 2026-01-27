import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HttpMethod } from '@shared/common/enums';
import { Input, Button } from '@/components/common';
import { Send } from 'lucide-react';

const requestFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  method: z.nativeEnum(HttpMethod),
  url: z.string().min(1, 'URL is required'),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

interface RequestFormProps {
  initialData?: Partial<RequestFormData>;
  onSubmit: (data: RequestFormData) => void;
  onSend: () => void;
  loading?: boolean;
}

/**
 * Форма для создания/редактирования запроса
 */
export const RequestForm = ({ initialData, onSubmit, onSend, loading }: RequestFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      name: initialData?.name || 'New Request',
      method: initialData?.method || HttpMethod.GET,
      url: initialData?.url || '',
    },
  });

  const handleSave = (data: RequestFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
      {/* Request Name */}
      <Input
        label="Request Name"
        placeholder="My API Request"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Method + URL Row */}
      <div className="flex gap-2">
        {/* HTTP Method Selector */}
        <select
          {...register('method')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {Object.values(HttpMethod).map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        {/* URL Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="https://api.example.com/endpoint"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('url')}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="button"
          onClick={onSend}
          loading={loading}
          icon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>

        {/* Save Button */}
        {isDirty && (
          <Button type="submit" variant="secondary">
            Save
          </Button>
        )}
      </div>
    </form>
  );
};
