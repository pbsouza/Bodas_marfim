import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Tv, Share2, Download, Heart } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const svgElement = document.getElementById('event-qr-code');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 800, 800);
      }
      const a = document.createElement('a');
      a.download = 'QRCode-Bianca-e-Pedro-14-Anos.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full transition-all bg-[#fdfbf7] border border-[#e2d5b6] shadow-2xl rounded-3xl overflow-hidden ${
          isFullscreen ? 'max-w-4xl p-10 text-center' : 'max-w-md p-6 sm:p-8'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3e5ab]/60 text-[#8b6f38] text-xs font-semibold border border-[#d4af37]/30">
            <Heart className="w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]" />
            <span>Festa de 14 Anos • Bianca & Pedro</span>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-[#3d3122]">
              Acesse a Festa via QR Code
            </h2>
            <p className="text-xs sm:text-sm text-[#7a6958] mt-1">
              Aponte a câmera do seu celular para entrar na galeria compartilhada e no mural de recados!
            </p>
          </div>

          {/* QR Code Canvas Frame */}
          <div className="p-6 bg-white rounded-2xl border-2 border-[#e8dfd5] inline-block shadow-inner mx-auto relative group">
            <QRCodeSVG
              id="event-qr-code"
              value={currentUrl}
              size={isFullscreen ? 320 : 220}
              bgColor="#ffffff"
              fgColor="#3d3122"
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b6f38'><path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>",
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
            <p className="mt-3 text-[11px] font-medium text-[#8c7a6b] tracking-wider uppercase">
              Bianca & Pedro • Bodas de Marfim
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 min-w-[130px] px-4 py-2.5 rounded-xl border border-[#d4af37]/40 bg-white hover:bg-[#f9f3e6] text-[#5c4a38] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#8b6f38]" />}
              <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl border border-[#d4af37]/40 bg-white hover:bg-[#f9f3e6] text-[#5c4a38] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              title="Baixar imagem do QR Code"
            >
              <Download className="w-4 h-4 text-[#8b6f38]" />
              <span className="hidden sm:inline">Baixar QR</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-4 py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              title="Modo Telão para o local do evento"
            >
              <Tv className="w-4 h-4" />
              <span>{isFullscreen ? 'Modo Normal' : 'Modo Telão'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
