import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'json' | 'javascript' | 'text';
  height?: string;
  readOnly?: boolean;
}

/**
 * Обертка для Monaco Editor
 */
export const CodeEditor = ({
  value,
  onChange,
  language = 'json',
  height = '300px',
  readOnly = false,
}: CodeEditorProps) => {
  const handleChange = (newValue: string | undefined) => {
    onChange(newValue || '');
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          readOnly,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
};
