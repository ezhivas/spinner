import { useEffect } from 'react';
import { Header, Layout, Sidebar, Workspace, StatusFooter } from './components/layout';
import { ToastContainer } from './components/common';
import { apiClient } from './api';

function App() {
  // Инициализация API клиента при запуске
  useEffect(() => {
    apiClient.init().catch((error) => {
      console.error('Failed to initialize API client:', error);
    });
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
