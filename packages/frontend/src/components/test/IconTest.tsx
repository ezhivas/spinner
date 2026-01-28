import { Plus, FileText, FolderOpen, Clock } from 'lucide-react';

export const IconTest = () => {
  return (
    <div style={{ padding: '20px', background: 'white' }}>
      <h3>Icon Test</h3>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <Plus size={24} color="red" />
        <FileText size={24} color="blue" />
        <FolderOpen size={24} color="green" />
        <Clock size={24} color="orange" />
      </div>
      <div style={{ marginTop: '10px' }}>
        <Plus className="w-6 h-6" style={{ color: 'purple', display: 'inline-block' }} />
        <FileText className="w-6 h-6" style={{ color: 'purple', display: 'inline-block' }} />
      </div>
    </div>
  );
};
