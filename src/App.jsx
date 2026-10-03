import { useState, useCallback, useEffect } from 'react';
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

  // Initialize history state on mount
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'cow', screen: 'home' }, '');
    }
  }, []);

  // Listen for browser popstate (Back / Forward buttons)
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.tab) setTab(e.state.tab);
        if (e.state.screen) setScreen(e.state.screen);
      } else {
        setTab('cow');
        setScreen('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = useCallback((message, type = 'ok') => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const switchTab = useCallback((newTab) => {
    setTab(newTab);
    window.history.pushState({ tab: newTab, screen: 'home' }, '');
  }, []);

  const goEntry = useCallback((type) => {
    const newScreen = type === 'cow' ? 'cowQ' : 'calfQ';
    setScreen(newScreen);
    window.history.pushState({ tab, screen: newScreen }, '');
  }, [tab]);

  const handleBackFromQuestionnaire = useCallback(() => {
    if (window.history.state?.screen && window.history.state.screen !== 'home') {
      window.history.back();
    } else {
      setScreen('home');
    }
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
        <QuestionnairePage type="cow" onBack={handleBackFromQuestionnaire} showToast={showToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }
  if (screen === 'calfQ') {
    return (
      <>
        <QuestionnairePage type="calf" onBack={handleBackFromQuestionnaire} showToast={showToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

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
