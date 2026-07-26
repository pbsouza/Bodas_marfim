import React from 'react';
import { Camera, QrCode, Heart, Sparkles, MessageSquare, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'gallery' | 'messages' | 'story';
  setActiveTab: (tab: 'gallery' | 'messages' | 'story') => void;
  onOpenCamera: () => void;
  onOpenQRCode: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  photosCount: number;
  messagesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCamera,
  onOpenQRCode,
  onOpenAdmin,
  isAdmin,
  photosCount,
  messagesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#e8dfd5] shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Couple Logo & Anniversary */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('story')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#c59b27] p-[2px] shadow-sm flex-shrink-0">
              <div className="w-full h-full bg-[#faf6f0] rounded-full flex items-center justify-center text-[#8b6f38] font-serif font-bold text-lg sm:text-xl">
                B&P
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#3d3122] tracking-tight">
                  Bianca & Pedro
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#f5eeda] text-[#8b6f38] border border-[#e2d5b6]">
                  <Heart className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
                  14 Anos
                </span>
              </div>
              <p className="text-xs text-[#8c7a6b] font-medium flex items-center gap-1">
                <span>Bodas de Marfim</span>
                <span className="text-[#c59b27]">•</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ao Vivo
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="admin-panel-btn"
              onClick={onOpenAdmin}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs ${
                isAdmin
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'border-[#e2d5b6] bg-white text-[#5c4a38] hover:bg-[#faf4e8]'
              }`}
              title="Painel de Moderação / Área dos Noivos"
            >
              <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-white' : 'text-[#8b6f38]'}`} />
              <span className="hidden md:inline">{isAdmin ? 'Modo Noivos' : 'Painel dos Noivos'}</span>
            </button>

            <button
              id="qr-code-btn"
              onClick={onOpenQRCode}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#e2d5b6] bg-white text-[#5c4a38] hover:bg-[#faf4e8] transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Exibir QR Code para convidados"
            >
              <QrCode className="w-4 h-4 text-[#8b6f38]" />
              <span className="hidden md:inline">QR Code Festa</span>
            </button>

            <button
              id="open-camera-btn"
              onClick={onOpenCamera}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8b6f38] via-[#a38345] to-[#8b6f38] text-white hover:opacity-95 active:scale-97 transition-all flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-md shadow-[#8b6f38]/20"
            >
              <Camera className="w-4 h-4 text-[#fef3c7]" />
              <span>Tirar Foto</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center sm:justify-start gap-1 mt-3 pt-2 border-t border-[#f0e6da]">
          <button
            id="tab-gallery-btn"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'gallery'
                ? 'bg-[#8b6f38] text-white shadow-xs font-semibold'
                : 'text-[#6e5d4f] hover:bg-[#f5ebd9] hover:text-[#3d3122]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galeria ao Vivo</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === 'gallery' ? 'bg-white/20 text-white' : 'bg-[#e8dfd5] text-[#5c4a38]'}`}>
              {photosCount}
            </span>
          </button>

          <button
            id="tab-messages-btn"
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-[#8b6f38] text-white shadow-xs font-semibold'
                : 'text-[#6e5d4f] hover:bg-[#f5ebd9] hover:text-[#3d3122]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mural de Recados</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${activeTab === 'messages' ? 'bg-white/20 text-white' : 'bg-[#e8dfd5] text-[#5c4a38]'}`}>
              {messagesCount}
            </span>
          </button>

          <button
            id="tab-story-btn"
            onClick={() => setActiveTab('story')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'story'
                ? 'bg-[#8b6f38] text-white shadow-xs font-semibold'
                : 'text-[#6e5d4f] hover:bg-[#f5ebd9] hover:text-[#3d3122]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Nossa História</span>
          </button>
        </div>
      </div>
    </header>
  );
};
