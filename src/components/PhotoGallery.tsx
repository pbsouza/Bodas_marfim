import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Maximize2, X, Play, Pause, Sparkles, Filter, MessageSquare, ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { Photo } from '../types';
import { likePhoto } from '../lib/firebase';
import { DriveImage } from './DriveImage';

interface PhotoGalleryProps {
  photos: Photo[];
  onOpenCamera: () => void;
  isAdmin?: boolean;
  onDeletePhoto?: (id: string) => void;
  onRefreshPhotos?: () => Promise<void>;
  isLoading?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onOpenCamera,
  isAdmin,
  onDeletePhoto,
  onRefreshPhotos,
  isLoading,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'popular' | 'captioned'>('all');
  const [isSlideshow, setIsSlideshow] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Slide auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSlideshow && photos.length > 0) {
      timer = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % photos.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isSlideshow, photos.length]);

  const handleLike = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedPhotoIds((prev) => ({ ...prev, [photoId]: true }));
    try {
      await likePhoto(photoId);
    } catch (err) {
      console.error('Erro ao curtir foto:', err);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'popular') return p.likes > 0;
    if (filter === 'captioned') return p.caption && p.caption.trim().length > 0;
    return true;
  });

  const downloadPhoto = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Gallery Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#e8dfd5] shadow-2xs">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3d3122] flex items-center gap-2">
            <span>Galeria ao Vivo</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f5eeda] text-[#8b6f38] border border-[#e2d5b6] font-sans font-semibold">
              {photos.length} Fotos
            </span>
          </h2>
          <p className="text-xs text-[#7a6958] mt-0.5">
            Fotos tiradas pelos convidados sincronizadas em tempo real
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#faf6f0] p-1 rounded-xl border border-[#e2d5b6]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f] hover:text-[#3d3122]'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'popular' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f] hover:text-[#3d3122]'
              }`}
            >
              Mais Curtidas
            </button>
            <button
              onClick={() => setFilter('captioned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'captioned' ? 'bg-[#8b6f38] text-white shadow-2xs' : 'text-[#6e5d4f] hover:text-[#3d3122]'
              }`}
            >
              Com Legenda
            </button>
          </div>

          {/* Refresh Button */}
          {onRefreshPhotos && (
            <button
              type="button"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await onRefreshPhotos();
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing || isLoading}
              className="px-3 py-2 rounded-xl bg-white hover:bg-[#faf6f0] border border-[#e2d5b6] text-[#8b6f38] text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Atualizar lista de fotos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          )}

          {/* Slideshow Button */}
          {photos.length > 0 && (
            <button
              onClick={() => {
                setIsSlideshow(!isSlideshow);
                setSlideshowIndex(0);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#f3e5ab]/60 hover:bg-[#f3e5ab] text-[#8b6f38] border border-[#d4af37]/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Modo Apresentação / Telão para TV"
            >
              {isSlideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSlideshow ? 'Sair do Telão' : 'Modo Telão'}</span>
            </button>
          )}

          {/* Camera Trigger */}
          <button
            onClick={onOpenCamera}
            className="px-4 py-2 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Tirar Foto</span>
          </button>
        </div>
      </div>

      {/* Grid of Photos */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-[#e8dfd5] text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#faf6f0] text-[#8b6f38] border border-[#e2d5b6] flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#3d3122]">Nenhuma foto nesta categoria ainda</h3>
            <p className="text-xs text-[#7a6958] mt-1">
              Seja o primeiro a capturar um momento especial das Bodas de Marfim de Bianca e Pedro!
            </p>
          </div>
          <button
            onClick={onOpenCamera}
            className="px-5 py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white font-semibold text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Abrir Câmera e Tirar Foto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => {
            const isLiked = likedPhotoIds[photo.id];
            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative bg-white rounded-2xl overflow-hidden border border-[#e8dfd5] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                {/* Image Canvas Container */}
                <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                  <DriveImage
                    src={photo.photoUrl}
                    alt={photo.caption || 'Foto da festa'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <span className="p-2.5 rounded-full bg-white/90 text-stone-800 shadow-md">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Top Badge: Author */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                    <span className="truncate max-w-[120px]">{photo.authorName}</span>
                  </div>

                  {/* Admin Delete Button */}
                  {isAdmin && onDeletePhoto && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePhoto(photo.id);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-transform hover:scale-110 z-10"
                      title="Apagar Foto (Noivos)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Footer Info */}
                <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-[#f0e6da]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#3d3122] truncate">
                      {photo.caption || 'Sem legenda'}
                    </p>
                    <p className="text-[10px] text-[#8c7a6b]">
                      {new Date(photo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Like Heart Button */}
                  <button
                    onClick={(e) => handleLike(photo.id, e)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isLiked
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-[#faf6f0] text-[#7a6958] border border-[#e2d5b6] hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                    <span>{photo.likes + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-[#fdfbf7] rounded-3xl border border-[#e2d5b6] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="px-5 py-3 border-b border-[#e8dfd5] bg-[#faf6f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#8b6f38] text-white flex items-center justify-center font-bold text-xs">
                  {selectedPhoto.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#3d3122]">{selectedPhoto.authorName}</p>
                  <p className="text-[10px] text-[#7a6958]">
                    {new Date(selectedPhoto.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && onDeletePhoto && (
                  <button
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors text-xs font-semibold flex items-center gap-1"
                    title="Apagar Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                )}
                <button
                  onClick={() => downloadPhoto(selectedPhoto.photoUrl, `festa-bianca-pedro-${selectedPhoto.id}.jpg`)}
                  className="p-2 rounded-xl bg-white border border-[#e2d5b6] text-[#5c4a38] hover:bg-[#faf4e8] transition-colors text-xs font-medium flex items-center gap-1"
                  title="Baixar Foto"
                >
                  <Download className="w-4 h-4 text-[#8b6f38]" />
                  <span className="hidden sm:inline">Baixar</span>
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo View */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-2 overflow-hidden min-h-[300px]">
              <DriveImage
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.caption || 'Foto expandida'}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>

            {/* Caption & Likes Bar */}
            <div className="p-4 bg-[#fdfbf7] border-t border-[#e8dfd5] flex items-center justify-between gap-3">
              <div className="flex-1">
                {selectedPhoto.caption ? (
                  <p className="text-sm font-semibold text-[#3d3122]">{selectedPhoto.caption}</p>
                ) : (
                  <p className="text-xs text-[#8c7a6b] italic">Momento registrado na festa de 14 anos de Bianca & Pedro</p>
                )}
              </div>

              <button
                onClick={() => handleLike(selectedPhoto.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  likedPhotoIds[selectedPhoto.id]
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-[#8b6f38] text-white hover:bg-[#735a2c]'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedPhotoIds[selectedPhoto.id] ? 'fill-white' : ''}`} />
                <span>
                  {likedPhotoIds[selectedPhoto.id] ? 'Curtido!' : 'Curtir Foto'} (
                  {selectedPhoto.likes + (likedPhotoIds[selectedPhoto.id] ? 1 : 0)})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN TELÃO / SLIDESHOW MODE */}
      {isSlideshow && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 animate-in fade-in duration-300">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-200">
                Bianca & Pedro • Bodas de Marfim (14 Anos)
              </h2>
            </div>
            <button
              onClick={() => setIsSlideshow(false)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Sair do Modo Telão</span>
            </button>
          </div>

          {/* Current Slide Display */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <DriveImage
              src={photos[slideshowIndex].photoUrl}
              alt="Slide"
              className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-500 transform scale-100"
            />
          </div>

          {/* Bottom Info Banner */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
            <button
              onClick={() => setSlideshowIndex((prev) => (prev - 1 + photos.length) % photos.length)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center flex-1">
              <p className="font-serif text-lg font-bold text-amber-200">
                {photos[slideshowIndex].authorName}
              </p>
              {photos[slideshowIndex].caption && (
                <p className="text-sm text-stone-200 mt-0.5 font-medium">
                  "{photos[slideshowIndex].caption}"
                </p>
              )}
            </div>

            <button
              onClick={() => setSlideshowIndex((prev) => (prev + 1) % photos.length)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
