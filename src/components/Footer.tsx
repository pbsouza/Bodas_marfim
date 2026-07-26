import React from 'react';
import { Heart, Sparkles, QrCode, Camera } from 'lucide-react';

interface FooterProps {
  onOpenCamera: () => void;
  onOpenQRCode: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCamera, onOpenQRCode, onOpenAdmin }) => {
  return (
    <footer className="mt-16 bg-[#faf6f0] border-t border-[#e8dfd5] py-10 px-4 text-center">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#8b6f38] p-0.5 mx-auto flex items-center justify-center shadow-xs">
          <div className="w-full h-full bg-[#faf6f0] rounded-full flex items-center justify-center font-serif font-bold text-[#8b6f38]">
            B&P
          </div>
        </div>

        <h3 className="font-serif text-xl font-bold text-[#3d3122]">
          Bianca & Pedro • 14 Anos de Amor
        </h3>
        <p className="text-xs text-[#7a6958] max-w-md mx-auto">
          Obrigado por fazer parte da nossa celebração de Bodas de Marfim! Guardaremos cada foto e recado com todo carinho.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3 text-xs">
          <button
            onClick={onOpenCamera}
            className="px-3.5 py-1.5 rounded-lg bg-[#8b6f38] text-white font-medium hover:bg-[#735a2c] transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Tirar Foto</span>
          </button>
          <button
            onClick={onOpenQRCode}
            className="px-3.5 py-1.5 rounded-lg border border-[#d4af37]/40 bg-white text-[#5c4a38] font-medium hover:bg-[#f9f3e6] transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-[#8b6f38]" />
            <span>QR Code da Festa</span>
          </button>
          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 rounded-lg border border-[#e2d5b6] bg-[#f5eeda] text-[#8b6f38] font-medium hover:bg-[#eae0d2] transition-colors flex items-center gap-1.5"
          >
            <span>Painel dos Noivos</span>
          </button>
        </div>

        <div className="pt-4 text-[11px] text-[#a39382] border-t border-[#f0e6da] flex items-center justify-center gap-1">
          <span>Feito com</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>para a festa de Bodas de Marfim de Bianca e Pedro • 2026</span>
        </div>
      </div>
    </footer>
  );
};
