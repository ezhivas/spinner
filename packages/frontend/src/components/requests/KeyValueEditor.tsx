import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  title: string;
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  placeholder?: { key: string; value: string };
}

/**
 * Редактор пар ключ-значение для Query Params, Headers и т.д.
 */
export const KeyValueEditor = ({
  title,
  items,
  onChange,
  placeholder = { key: 'key', value: 'value' },
}: KeyValueEditorProps) => {
  const handleAdd = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          icon={<Plus className="w-4 h-4" />}
        >
          Add
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No {title.toLowerCase()} yet. Click "Add" to create one.
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => handleChange(index, 'enabled', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />

            {/* Key Input */}
            <input
              type="text"
              placeholder={placeholder.key}
              value={item.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* Value Input */}
            <input
              type="text"
              placeholder={placeholder.value}
              value={item.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
