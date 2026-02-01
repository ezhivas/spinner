import { useState } from 'react';
import { FileCode, Upload } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { requestsApi } from '@/api';
import { useToastStore } from '@/store';

interface ImportCurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId?: number;
  onSuccess?: (requestId: number) => void;
}

/**
 * Modal window for importing a request from a cURL command
 */
export const ImportCurlModal = ({ isOpen, onClose, collectionId, onSuccess }: ImportCurlModalProps) => {
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');

  const handleImport = async () => {
    if (!curlCommand.trim()) {
      showError('Please enter a cURL command');
      return;
    }

    setLoading(true);
    try {
      const request = await requestsApi.importFromCurl(curlCommand, collectionId);

      success(`Request "${request.name}" imported successfully`);
      setCurlCommand('');
      onClose();

      if (onSuccess) {
        onSuccess(request.id);
      }
    } catch (err) {
      showError('Failed to import cURL command. Please check the format.');
      console.error('Import cURL error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurlCommand('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import from cURL" size="lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FileCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">Import cURL Command</h3>
            <p className="text-sm text-blue-700">
              Paste a cURL command to create a new request. The command will be parsed to extract
              URL, method, headers, and body.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            cURL Command
          </label>
          <textarea
            value={curlCommand}
            onChange={(e) => setCurlCommand(e.target.value)}
            placeholder={`curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name":"John"}'`}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            Example: curl -X POST https://api.example.com/users -H &apos;Content-Type: application/json&apos;
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={loading || !curlCommand.trim()}
          icon={<Upload className="w-4 h-4" />}
        >
          Import Request
        </Button>
      </div>
    </Modal>
  );
};
