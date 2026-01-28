import { useState } from 'react';
import { Trash2, Clock } from 'lucide-react';
import { Modal, Button, Input } from '@/components/common';
import { useRunsStore, useToastStore } from '@/store';

interface CleanupHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно для массового удаления старых записей истории
 */
export const CleanupHistoryModal = ({ isOpen, onClose }: CleanupHistoryModalProps) => {
  const { cleanupOldRuns, clearHistory } = useRunsStore();
  const { success, error: showError } = useToastStore();
  const [customHours, setCustomHours] = useState('24');
  const [loading, setLoading] = useState(false);

  const handleCleanup = async (hours: number | 'all') => {
    setLoading(true);
    try {
      if (hours === 'all') {
        await clearHistory();
        success('All history cleared');
      } else {
        const result = await cleanupOldRuns(hours);
        success(`Deleted ${result.deleted} run(s) older than ${hours} hour(s)`);
      }
      onClose();
    } catch {
      showError('Failed to cleanup history');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomCleanup = async () => {
    const hours = parseInt(customHours, 10);
    if (isNaN(hours) || hours <= 0) {
      showError('Please enter a valid number of hours');
      return;
    }
    await handleCleanup(hours);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cleanup History" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose how to clean up your request execution history:
        </p>

        {/* Preset options */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Options</h3>
          
          <button
            onClick={() => handleCleanup(1)}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Last 1 hour</div>
              <div className="text-xs text-gray-500">Delete runs older than 1 hour</div>
            </div>
          </button>

          <button
            onClick={() => handleCleanup(24)}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Last 24 hours</div>
              <div className="text-xs text-gray-500">Delete runs older than 1 day</div>
            </div>
          </button>

          <button
            onClick={() => handleCleanup(168)}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Last 7 days</div>
              <div className="text-xs text-gray-500">Delete runs older than 1 week</div>
            </div>
          </button>

          <button
            onClick={() => handleCleanup('all')}
            disabled={loading}
            className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <div className="flex-1 text-left">
              <div className="font-medium text-red-900">Delete All</div>
              <div className="text-xs text-red-600">Clear entire history</div>
            </div>
          </button>
        </div>

        {/* Custom hours input */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Timeframe</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="Hours to keep"
                min="1"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleCustomCleanup}
              disabled={loading}
              className="whitespace-nowrap"
            >
              Cleanup
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Keep runs from the last N hours, delete older ones
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
