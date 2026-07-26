import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Send, Sparkles, Filter, Smile, PartyPopper, Trash2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GuestMessage } from '../types';
import { addMessage, likeMessage } from '../lib/firebase';

interface MessageWallProps {
  messages: GuestMessage[];
  isAdmin?: boolean;
  onDeleteMessage?: (id: string) => void;
  onRefreshMessages?: () => Promise<void>;
  isLoading?: boolean;
  onMessageAdded?: (msg: GuestMessage) => void;
}

export const MessageWall: React.FC<MessageWallProps> = ({
  messages,
  isAdmin,
  onDeleteMessage,
  onRefreshMessages,
  isLoading,
  onMessageAdded,
}) => {
  const [authorName, setAuthorName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'desejo' | 'lembranca' | 'carinho'>('carinho');
  const [filterCategory, setFilterCategory] = useState<'all' | 'desejo' | 'lembranca' | 'carinho'>('all');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [likedMessageIds, setLikedMessageIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedName = localStorage.getItem('guest_author_name');
    if (savedName) setAuthorName(savedName);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const finalName = authorName.trim() || 'Convidado(a) Especial';
    localStorage.setItem('guest_author_name', finalName);

    setIsSending(true);
    try {
      const docRef = await addMessage({
        authorName: finalName,
        content: content.trim(),
        category,
      });

      if (onMessageAdded) {
        onMessageAdded({
          id: docRef.id,
          authorName: finalName,
          content: content.trim(),
          category,
          likes: 0,
          createdAt: new Date().toISOString(),
        });
      } else if (onRefreshMessages) {
        await onRefreshMessages();
      }

      setContent('');

      // Confetti burst
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#d4af37', '#f3e5ab', '#8b6f38', '#ffffff'],
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Não foi possível enviar a mensagem. Tente novamente!');
    } finally {
      setIsSending(false);
    }
  };

  const handleLike = async (messageId: string) => {
    setLikedMessageIds((prev) => ({ ...prev, [messageId]: true }));
    try {
      await likeMessage(messageId);
    } catch (err) {
      console.error('Erro ao curtir mensagem:', err);
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + ' ' + emoji);
  };

  const filteredMessages = messages.filter((m) => {
    if (filterCategory === 'all') return true;
    return m.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8dfd5] shadow-2xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f0e6da]">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#3d3122] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#8b6f38]" />
              <span>Mural de Recados para Bianca & Pedro</span>
            </h2>
            <p className="text-xs text-[#7a6958] mt-0.5">
              Deixe suas felicitações de Bodas de Marfim! Todos os convidados verão em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefreshMessages && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefreshMessages();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing || isLoading}
                className="px-3 py-1 rounded-full bg-white hover:bg-[#faf6f0] border border-[#e2d5b6] text-[#8b6f38] text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Atualizar mensagens"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            )}
            <span className="px-3 py-1 rounded-full bg-[#f5eeda] text-[#8b6f38] border border-[#e2d5b6] text-xs font-semibold">
              {messages.length} Mensagens
            </span>
          </div>
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                Seu Nome:
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Tio Roberto, Camila e Bruno..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#d4af37]/50 bg-[#fdfbf7] text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                Categoria do Recado:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#d4af37]/50 bg-[#fdfbf7] text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
              >
                <option value="carinho">❤️ Mensagem de Carinho</option>
                <option value="desejo">✨ Desejos para o Casal</option>
                <option value="lembranca">🥂 Lembrança Especial</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#5c4a38]">
                Sua Mensagem:
              </label>

              {/* Quick Emojis */}
              <div className="flex items-center gap-1">
                {['❤️', '🥂', '💍', '✨', '🎉', '🥂'].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => addEmoji(e)}
                    className="p-1 text-sm rounded hover:bg-[#f5eeda] transition-colors"
                    title={`Adicionar ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui seu carinho para Bianca e Pedro nestes 14 anos de felicidade..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#d4af37]/50 bg-[#fdfbf7] text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38] resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Enviando...' : 'Publicar no Mural'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#e8dfd5] shadow-2xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'all' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterCategory('carinho')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'carinho' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f]'
            }`}
          >
            ❤️ Carinho
          </button>
          <button
            onClick={() => setFilterCategory('desejo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'desejo' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f]'
            }`}
          >
            ✨ Desejos
          </button>
          <button
            onClick={() => setFilterCategory('lembranca')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === 'lembranca' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f]'
            }`}
          >
            🥂 Lembranças
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#e8dfd5] text-center space-y-2 max-w-md mx-auto">
          <PartyPopper className="w-8 h-8 text-[#d4af37] mx-auto" />
          <p className="font-serif font-bold text-[#3d3122]">Nenhum recado nesta categoria ainda</p>
          <p className="text-xs text-[#7a6958]">Escreva a primeira mensagem acima e espalhe amor para o casal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMessages.map((msg) => {
            const isLiked = likedMessageIds[msg.id];
            return (
              <div
                key={msg.id}
                className="bg-white p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs hover:border-[#d4af37] transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#f5eeda] text-[#8b6f38] font-bold text-xs flex items-center justify-center border border-[#e2d5b6]">
                        {msg.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#3d3122]">{msg.authorName}</p>
                        <p className="text-[10px] text-[#8c7a6b]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        msg.category === 'desejo'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : msg.category === 'lembranca'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {msg.category === 'desejo' ? '✨ Desejo' : msg.category === 'lembranca' ? '🥂 Lembrança' : '❤️ Carinho'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#4a3b2c] leading-relaxed font-sans whitespace-pre-wrap">
                    "{msg.content}"
                  </p>
                </div>

                <div className="pt-2 border-t border-[#f5ebd9] flex items-center justify-between text-xs text-[#8c7a6b]">
                  <span className="text-[11px] font-serif text-[#8b6f38]">Bodas de Marfim</span>

                  <div className="flex items-center gap-2">
                    {isAdmin && onDeleteMessage && (
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                        title="Apagar recado (Noivos)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleLike(msg.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isLiked
                          ? 'bg-rose-500 text-white'
                          : 'bg-[#faf6f0] text-[#7a6958] hover:bg-rose-50 hover:text-rose-600 border border-[#e2d5b6]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white text-white' : ''}`} />
                      <span>{msg.likes + (isLiked ? 1 : 0)}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
