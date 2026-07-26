import React from 'react';
import { Heart, Sparkles, Calendar, Clock, Award, Shield, Gift, Camera, MessageSquare } from 'lucide-react';

interface LoveMilestoneProps {
  onOpenCamera: () => void;
  onOpenMessage: () => void;
  photosCount: number;
  messagesCount: number;
}

export const LoveMilestone: React.FC<LoveMilestoneProps> = ({
  onOpenCamera,
  onOpenMessage,
  photosCount,
  messagesCount,
}) => {
  return (
    <div className="space-y-8 py-2">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#faf6f0] via-[#f5eeda] to-[#ebdcc4] p-6 sm:p-10 border border-[#e2d5b6] shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gradient-to-br from-[#d4af37]/20 to-amber-500/0 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#d4af37]/40 text-[#8b6f38] text-xs sm:text-sm font-semibold shadow-2xs backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span>2012 — 2026 • Celebração Especial</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#3d3122] leading-tight">
            Bianca & Pedro
          </h1>
          <p className="font-serif text-xl sm:text-2xl text-[#8b6f38] italic font-medium">
            14 Anos de Casamento — Bodas de Marfim
          </p>

          <p className="text-sm sm:text-base text-[#6e5d4f] leading-relaxed max-w-2xl mx-auto">
            Sejam bem-vindos à nossa festa! O marfim simboliza resistência, nobreza e a beleza preciosa das histórias construídas dia a dia. Compartilhe fotos do seu celular e deixe uma mensagem especial no nosso mural em tempo real!
          </p>

          {/* Quick Action Grid */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenCamera}
              className="px-6 py-3 rounded-2xl bg-[#8b6f38] hover:bg-[#735a2c] text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-amber-200" />
              <span>Tirar Foto Agora ({photosCount})</span>
            </button>
            <button
              onClick={onOpenMessage}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-[#faf4e8] text-[#5c4a38] border border-[#d4af37]/50 font-semibold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#8b6f38]" />
              <span>Escrever no Mural ({messagesCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Love Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs text-center space-y-1 hover:border-[#d4af37] transition-colors">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#fdf8ee] text-[#8b6f38] flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3d3122]">14 Anos</p>
          <p className="text-xs text-[#8c7a6b] font-medium">Bodas de Marfim</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs text-center space-y-1 hover:border-[#d4af37] transition-colors">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#fdf8ee] text-[#8b6f38] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#8b6f38]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3d3122]">168 Meses</p>
          <p className="text-xs text-[#8c7a6b] font-medium">De União & Viagens</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs text-center space-y-1 hover:border-[#d4af37] transition-colors">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#fdf8ee] text-[#8b6f38] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#8b6f38]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3d3122]">5.113 Dias</p>
          <p className="text-xs text-[#8c7a6b] font-medium">De Cumplicidade</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs text-center space-y-1 hover:border-[#d4af37] transition-colors">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#fdf8ee] text-[#8b6f38] flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#8b6f38]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#3d3122]">Infinitos</p>
          <p className="text-xs text-[#8c7a6b] font-medium">Momentos Inesquecíveis</p>
        </div>
      </div>

      {/* Meaning of Bodas de Marfim */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e8dfd5] shadow-2xs grid md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-[#8b6f38] font-semibold text-sm">
            <Award className="w-4 h-4 text-[#d4af37]" />
            <span>O Significado de Bodas de Marfim</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3d3122]">
            Resistência, Nobreza e Amor Duradouro
          </h2>
          <p className="text-sm text-[#6e5d4f] leading-relaxed">
            O marfim é um elemento raro, resistente e precioso. Celebrar 14 anos de casamento significa que o amor superou desafios, amadureceu e se tornou inquebrável, assim como a solidez do marfim.
          </p>
        </div>
        <div className="bg-[#faf6f0] p-5 rounded-xl border border-[#e2d5b6] text-center space-y-2">
          <Shield className="w-8 h-8 text-[#8b6f38] mx-auto" />
          <p className="font-serif font-bold text-[#3d3122] text-sm">Como participar da festa:</p>
          <ol className="text-xs text-[#6e5d4f] text-left space-y-1.5 list-decimal pl-4">
            <li>Toque em <b>"Tirar Foto"</b> no menu superior.</li>
            <li>Aplique moldura festiva e filtros.</li>
            <li>Poste no <b>Mural de Recados</b> com carinho!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
