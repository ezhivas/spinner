import { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { useEnvironmentsStore, useToastStore } from '@/store';

interface EnvironmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvironmentImportModal = ({ isOpen, onClose }: EnvironmentImportModalProps) => {
  const { importEnvironment } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setPreview(null);

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      // Validate Postman environment format
      if (!data.name || !data.values) {
        throw new Error('Invalid Postman environment format. Missing "name" or "values" field.');
      }

      setPreview(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/json') {
      handleFileSelect(droppedFile);
    } else {
      setError('Please drop a valid JSON file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      await importEnvironment(preview);
      success(`Environment "${preview.name}" imported successfully`);
      onClose();
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError((err as Error).message);
      showError('Failed to import environment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Environment" size="md">
      <div className="space-y-4">
        {/* File Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            file
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileJson className="w-12 h-12 text-primary-600" />
              <p className="text-sm font-medium text-primary-900">{file.name}</p>
              <p className="text-xs text-primary-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Drop Postman environment here or click to browse
              </p>
              <p className="text-xs text-gray-500">Supports Postman Environment format</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && !error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Ready to import</p>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Name:</strong> {preview.name}
                  </p>
                  {preview._postman_variable_scope && (
                    <p>
                      <strong>Scope:</strong> {preview._postman_variable_scope}
                    </p>
                  )}
                  <p>
                    <strong>Variables:</strong> {preview.values?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleImport}
            disabled={!preview || loading}
            loading={loading}
          >
            Import Environment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
