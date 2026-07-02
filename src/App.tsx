// ============================================================
// App.tsx — 路由 + 全局状态 Context
// ============================================================

import { useState, useCallback, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ModelName, Insight } from './types';
import Navbar from './components/Navbar';
import ApiKeyModal from './components/ApiKeyModal';
import Treehole from './pages/Treehole';
import DeepChat from './pages/DeepChat';
import SettingsPage from './pages/SettingsPage';
import { loadAppState, setApiKey, removeApiKey, setModel, getInsights } from './utils/storage';

// ---- App Context ----
interface AppContextType {
  apiKey: string | null;
  model: ModelName;
  setApiKeyAndSave: (key: string) => void;
  removeApiKeyAndSave: () => void;
  setModelAndSave: (model: ModelName) => void;
  refreshInsights: () => Insight[];
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within App');
  return ctx;
}

// ---- Main App ----
export default function App() {
  const initial = loadAppState();

  const [apiKey, setApiKeyState] = useState<string | null>(initial.apiKey);
  const [model, setModelState] = useState<ModelName>(initial.model);
  const [isModalOpen, setIsModalOpen] = useState(!initial.apiKey);
  const [insightVersion, setInsightVersion] = useState(0);

  const setApiKeyAndSave = useCallback((key: string) => {
    setApiKey(key);
    setApiKeyState(key);
    setIsModalOpen(false);
  }, []);

  const removeApiKeyAndSave = useCallback(() => {
    removeApiKey();
    setApiKeyState(null);
  }, []);

  const setModelAndSave = useCallback((m: ModelName) => {
    setModel(m);
    setModelState(m);
  }, []);

  const refreshInsights = useCallback(() => {
    setInsightVersion((v) => v + 1);
    return getInsights();
  }, []);

  const handleNewInsight = useCallback(() => {
    setInsightVersion((v) => v + 1);
  }, []);

  const ctx: AppContextType = {
    apiKey,
    model,
    setApiKeyAndSave,
    removeApiKeyAndSave,
    setModelAndSave,
    refreshInsights,
  };

  return (
    <AppContext.Provider value={ctx}>
      <HashRouter>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
          {/* Main content */}
          <main className="flex-1 pb-16">
            <Routes>
              <Route
                path="/treehole"
                element={
                  <Treehole
                    apiKey={apiKey || ''}
                    model={model}
                    onNewInsight={handleNewInsight}
                  />
                }
              />
              <Route
                path="/deepchat"
                element={
                  <DeepChat
                    apiKey={apiKey || ''}
                    model={model}
                    onNewInsight={handleNewInsight}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    apiKey={apiKey}
                    model={model}
                    onApiKeyChange={(key) => {
                      if (key) setApiKeyAndSave(key);
                      else removeApiKeyAndSave();
                    }}
                    onModelChange={setModelAndSave}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/treehole" replace />} />
            </Routes>
          </main>

          {/* Navbar */}
          <Navbar />

          {/* API Key Modal */}
          <ApiKeyModal
            isOpen={isModalOpen}
            currentKey={apiKey}
            onSave={setApiKeyAndSave}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
}
