import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { Toast } from './Toast';
import { PipelineModal } from './PipelineModal';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (state) => ({
  toast: state.toast,
  setToast: state.setToast,
  clearToast: state.clearToast,
  modalData: state.modalData,
  clearModalData: state.clearModalData,
});

function App() {
  const { toast, setToast, clearToast, modalData, clearModalData } = useStore(selector, shallow);

  return (
    <div className="app">
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton onResult={setToast} />
      <Toast toast={toast} onClose={clearToast} />
      {modalData && <PipelineModal data={modalData} onClose={clearModalData} />}
    </div>
  );
}

export default App;

