import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { useCollectionsStore, useToastStore } from '@/store';
import type { ICollection } from '@shared/collections';

const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: ICollection | null;
}

/**
 * Модальное окно для создания/редактирования коллекции
 */
export const CollectionModal = ({ isOpen, onClose, collection }: CollectionModalProps) => {
  const { createCollection, updateCollection, loading } = useCollectionsStore();
  const { success, error: showError } = useToastStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
    },
  });

  // Сброс формы при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      reset({
        name: collection?.name || '',
        description: collection?.description || '',
      });
    }
  }, [isOpen, collection, reset]);

  const onSubmit = async (data: CollectionFormData) => {
    try {
      if (collection) {
        // Обновление существующей коллекции
        await updateCollection(collection.id, data.name, data.description);
        success('Collection updated successfully');
      } else {
        // Создание новой коллекции
        await createCollection(data.name, data.description);
        success('Collection created successfully');
      }
      onClose();
      reset();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save collection');
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={collection ? 'Edit Collection' : 'New Collection'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="My API Collection"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="Optional description for this collection"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

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
            {collection ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
