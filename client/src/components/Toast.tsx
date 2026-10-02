import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "../store/toast.store";

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
  error: "text-red-400 border-red-400/20 bg-red-400/5",
  info: "text-gold border-gold/20 bg-gold/5",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 sm:max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl animate-slideUp ${colors[toast.type]}`}
          >
            <Icon size={18} className="shrink-0" />
            <p className="text-sm flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
