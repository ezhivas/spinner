import { useEffect } from 'react';
import { Header, Layout, Sidebar, Workspace, StatusFooter } from './components/layout';
import { ToastContainer } from './components/common';
import { apiClient } from './api';
import { logger } from './utils/logger';
import { useThemeStore } from './store';

function App() {
  const { initTheme } = useThemeStore();

  // Инициализация API клиента при запуске
  useEffect(() => {
    apiClient.init().catch((error) => {
      logger.error('Failed to initialize API client', error);
    });
    initTheme();
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen">
        <Header />
        <Layout>
          <Sidebar />
          <Workspace />
        </Layout>
        <StatusFooter />
      </div>
      <ToastContainer />
    </>
  );
}

export default App;
