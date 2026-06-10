import { QrCode } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <QrCode size={26} />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
        Sahifa topilmadi
      </h1>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500">
        QR kodni qayta skanerlang yoki ofitsiantga murojaat qiling.
      </p>
    </div>
  );
}
