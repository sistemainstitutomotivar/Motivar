import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  title: string;
  message?: string;
  type?: AlertType;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AlertModal: React.FC<AlertProps> = ({ 
  title, message, type = 'info', 
  showCancel = false, confirmText = 'OK', cancelText = 'Cancelar',
  onConfirm, onCancel 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = (action: 'confirm' | 'cancel') => {
    setIsOpen(false);
    setTimeout(() => {
      if (action === 'confirm') onConfirm();
      else onCancel();
    }, 200); // Wait for animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />;
      case 'error': return <AlertCircle className="w-12 h-12 text-red-500 mb-4" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />;
      default: return <Info className="w-12 h-12 text-blue-500 mb-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {getIcon()}
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        {message && <p className="text-sm text-slate-600 mb-6">{message}</p>}
        
        <div className="flex gap-3 w-full mt-2">
          {showCancel && (
            <button
              onClick={() => handleClose('cancel')}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => handleClose('confirm')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-white transition-colors ${
              type === 'error' ? 'bg-red-500 hover:bg-red-600' :
              type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
              type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
              'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Singleton para montar o modal
const createAlert = (props: Omit<AlertProps, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    const cleanup = () => {
      setTimeout(() => {
        root.unmount();
        if (document.body.contains(div)) {
          document.body.removeChild(div);
        }
      }, 300); // After unmount animation
    };

    root.render(
      <AlertModal
        {...props}
        onConfirm={() => {
          cleanup();
          resolve(true);
        }}
        onCancel={() => {
          cleanup();
          resolve(false);
        }}
      />
    );
  });
};

export const showAlert = (title: string, message?: string, type: AlertType = 'info') => {
  return createAlert({ title, message, type, showCancel: false });
};

export const showConfirm = (title: string, message?: string, type: AlertType = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
  return createAlert({ title, message, type, showCancel: true, confirmText, cancelText });
};
