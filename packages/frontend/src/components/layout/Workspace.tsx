import { useTabsStore } from '@/store';
import { RequestEditor } from '@/components/requests/RequestEditor';

/**
 * Workspace область с вкладками и редакторами запросов
 */
export const Workspace = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabsStore();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Welcome to SpinneR</h3>
          <p className="text-sm">Create or select a request to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Tabs Bar */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer whitespace-nowrap
              ${activeTabId === tab.id ? 'bg-white border-b-2 border-primary-500 -mb-px' : 'hover:bg-gray-100'}
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-sm">
              {tab.name || 'Untitled Request'}
              {tab.isDirty && <span className="text-orange-500">*</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="hover:bg-gray-200 rounded px-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <RequestEditor
            requestId={activeTab.requestId}
            onSave={(request) => {
              // Обновить вкладку после сохранения
              const { updateTab } = useTabsStore.getState();
              updateTab(activeTab.id, {
                requestId: request.id,
                name: request.name,
                isDirty: false,
              });
            }}
          />
        )}
      </div>
    </div>
  );
};
