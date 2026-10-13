import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ToastContainer({ toasts = [] }) {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              className={`toast-item ${toast.type || 'info'}`}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              layout
            >
              <Icon size={18} />
              <span>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
