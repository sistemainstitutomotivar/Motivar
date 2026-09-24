import { CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-500 delay-150">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          Sucesso!
        </h2>
        <p className="text-slate-600 mb-8">
          Seu e-mail foi confirmado e sua conta está autenticada. Seja muito bem-vindo(a) ao sistema do Instituto Motivar!
        </p>

        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-lg"
        >
          Acessar meu painel <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
