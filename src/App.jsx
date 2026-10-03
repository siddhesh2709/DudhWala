import { useState, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import SetupPage from './pages/SetupPage';
import CowPage from './pages/CowPage';
import CalfPage from './pages/CalfPage';
import ProfilePage from './pages/ProfilePage';
import QuestionnairePage from './pages/QuestionnairePage';
import { ToastContainer } from './components/Toast';

let toastId = 0;

function Inner() {
  const { state } = useApp();
  const hasProfile = !!state.profile;

  const [tab, setTab] = useState('cow');          // cow | calf | profile
  const [screen, setScreen] = useState('home');   // home | cowQ | calfQ
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'ok') => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // First-time setup
  if (!hasProfile) {
    return (
      <>
        <SetupPage onDone={() => setScreen('home')} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Questionnaire overlay (full screen)
  if (screen === 'cowQ') {
    return (
      <>
        <QuestionnairePage type="cow" onBack={() => setScreen('home')} showToast={showToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }
  if (screen === 'calfQ') {
    return (
      <>
        <QuestionnairePage type="calf" onBack={() => setScreen('home')} showToast={showToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Main tabbed UI
  const switchTab = (t) => setTab(t);
  const goEntry = (type) => setScreen(type === 'cow' ? 'cowQ' : 'calfQ');

  return (
    <>
      {tab === 'cow'     && <CowPage     onSwitchTab={switchTab} onGoEntry={goEntry} />}
      {tab === 'calf'    && <CalfPage    onSwitchTab={switchTab} onGoEntry={goEntry} />}
      {tab === 'profile' && <ProfilePage onSwitchTab={switchTab} showToast={showToast} />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <Inner />
      </div>
    </AppProvider>
  );
}
