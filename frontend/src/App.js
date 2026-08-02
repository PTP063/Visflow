import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { Toast } from './Toast';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (state) => ({
  toast: state.toast,
  setToast: state.setToast,
  clearToast: state.clearToast,
});

function App() {
  // Toast state lives in the store (not local useState) because it needs
  // to be settable from outside a component too — onConnect in store.js
  // fires a toast directly when it blocks a cycle-creating connection.
  const { toast, setToast, clearToast } = useStore(selector, shallow);

  return (
    <div className="app">
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton onResult={setToast} />
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

export default App;
