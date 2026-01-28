import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { HttpMethod } from '@shared/common/enums';
import { Input, Button } from '@/components/common';
import { Send, StopCircle } from 'lucide-react';
import { useCollectionsStore } from '@/store';

const requestFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  method: z.nativeEnum(HttpMethod),
  url: z.string().min(1, 'URL is required'),
  collectionId: z.number().optional(),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

interface RequestFormProps {
  initialData?: Partial<RequestFormData>;
  onSubmit: (data: RequestFormData) => void;
  onChange?: (data: Partial<RequestFormData>) => void;
  onSend: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isDirtyExternal?: boolean; // Внешнее состояние isDirty для отслеживания всех изменений
}

/**
 * Форма для создания/редактирования запроса
 */
export const RequestForm = ({ initialData, onSubmit, onChange, onSend, onCancel, loading, isDirtyExternal }: RequestFormProps) => {
  const { collections, fetchCollections } = useCollectionsStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      name: initialData?.name || 'New Request',
      method: initialData?.method || HttpMethod.GET,
      url: initialData?.url || '',
      collectionId: initialData?.collectionId,
    },
  });

  // Watch form changes and notify parent
  useEffect(() => {
    const subscription = watch((value) => {
      if (onChange) {
        onChange(value as Partial<RequestFormData>);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const handleSave = (data: RequestFormData) => {
    onSubmit(data);
  };

  // Используем внешний isDirty если передан, иначе внутренний
  const showSaveButton = isDirtyExternal !== undefined ? isDirtyExternal : isDirty;

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
      {/* Request Name */}
      <Input
        label="Request Name"
        placeholder="My API Request"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Collection Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Collection (Optional)
        </label>
        <select
          {...register('collectionId', {
            setValueAs: (v) => (v === '' ? undefined : Number(v)),
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">No Collection</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

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
          disabled={loading}
        >
          Send
        </Button>

        {/* Cancel Button - показываем только когда запрос выполняется */}
        {loading && onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            icon={<StopCircle className="w-4 h-4" />}
          >
            Cancel
          </Button>
        )}

        {/* Save Button */}
        {showSaveButton && (
          <Button type="submit" variant="secondary">
            Save
          </Button>
        )}
      </div>
    </form>
  );
};
