import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, Sparkles, Upload, Check, Image as ImageIcon, Link as LinkIcon, Heart, HardDrive, CloudUpload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Photo } from '../types';
import { addPhoto } from '../lib/firebase';
import { getDriveToken, connectGoogleDrive, uploadImageToDriveFolder } from '../lib/googleDrive';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAdded?: (newPhoto?: Photo) => void;
}

type FilterType = 'normal' | 'sepia' | 'grayscale' | 'warm' | 'vintage';

export const formatDriveOrImageUrl = (url: string): string => {
  if (!url) return url;
  const trimmed = url.trim();

  // Match drive.google.com/file/d/FILE_ID/view
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  // Match drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  return trimmed;
};

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onPhotoAdded }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'link'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [filter, setFilter] = useState<FilterType>('normal');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load last used author name from localStorage if available
  useEffect(() => {
    const savedName = localStorage.getItem('guest_author_name');
    if (savedName) setAuthorName(savedName);
  }, []);

  // Handle Camera Stream Lifecycle
  useEffect(() => {
    if (!isOpen || capturedImage) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setCameraError('Não foi possível acessar a câmera. Você pode escolher uma foto da sua galeria abaixo!');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 800;
    const height = video.videoHeight || 600;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply Filter on Canvas
    if (filter === 'sepia') ctx.filter = 'sepia(0.85) contrast(1.1)';
    else if (filter === 'grayscale') ctx.filter = 'grayscale(1) contrast(1.2)';
    else if (filter === 'warm') ctx.filter = 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)';
    else if (filter === 'vintage') ctx.filter = 'contrast(1.1) brightness(0.95) saturate(0.85) sepia(0.2)';
    else ctx.filter = 'none';

    // Flip horizontally if front camera user
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Reset filter & transform for watermark overlay
    ctx.filter = 'none';
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Add Decorative Frame Watermark if enabled
    if (showWatermark) {
      // Bottom banner gradient
      const bannerHeight = Math.max(60, height * 0.12);
      const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
      gradient.addColorStop(0, 'rgba(61, 49, 34, 0)');
      gradient.addColorStop(1, 'rgba(30, 24, 16, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

      // Gold text frame
      ctx.fillStyle = '#f3e5ab';
      ctx.font = `bold ${Math.max(16, Math.round(width * 0.035))}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Bianca & Pedro • 14 Anos de Amor', width / 2, height - bannerHeight * 0.45);

      ctx.fillStyle = '#d4af37';
      ctx.font = `${Math.max(12, Math.round(width * 0.024))}px sans-serif`;
      ctx.fillText('Bodas de Marfim ✨ Galeria da Festa', width / 2, height - bannerHeight * 0.2);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxDim = 800;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.72));
          stopCamera();
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (activeTab === 'link') {
      if (!driveUrlInput.trim()) {
        alert('Por favor, cole um link válido do Google Drive ou da Web.');
        return;
      }
    } else {
      if (!capturedImage) {
        alert('Por favor, tire uma foto ou selecione uma imagem primeiro.');
        return;
      }
    }

    setIsUploading(true);

    try {
      let finalPhotoUrl = '';
      const token = getDriveToken();

      if (activeTab === 'link') {
        finalPhotoUrl = formatDriveOrImageUrl(driveUrlInput);
      } else {
        // If Google Drive token is present, attempt direct upload to Drive with 7s timeout
        if (token && capturedImage) {
          try {
            const safeAuthor = (authorName.trim() || 'convidado').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const fileName = `foto-bodas-marfim-${safeAuthor}-${Date.now()}.jpg`;

            const uploadTask = uploadImageToDriveFolder(token, capturedImage, fileName);
            const timeoutTask = new Promise<{ fileId: string; directUrl: string }>((_, reject) =>
              setTimeout(() => reject(new Error('Tempo limite do Drive excedido')), 7000)
            );

            const driveResult = await Promise.race([uploadTask, timeoutTask]);
            finalPhotoUrl = driveResult.directUrl;
          } catch (driveErr) {
            console.warn('Salvando foto diretamente no banco de dados (Drive ignorado/timeout):', driveErr);
            finalPhotoUrl = capturedImage;
          }
        } else {
          finalPhotoUrl = capturedImage;
        }
      }

      const finalAuthor = authorName.trim() || 'Convidado Especial';
      localStorage.setItem('guest_author_name', finalAuthor);

      const photoFilter = activeTab === 'link' ? 'normal' : filter;
      const docRef = await addPhoto({
        photoUrl: finalPhotoUrl,
        authorName: finalAuthor,
        caption: caption.trim(),
        filter: photoFilter,
      });

      const newPhotoObj: Photo = {
        id: docRef.id,
        photoUrl: finalPhotoUrl,
        authorName: finalAuthor,
        caption: caption.trim(),
        likes: 0,
        filter: photoFilter,
        createdAt: new Date().toISOString(),
      };

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f3e5ab', '#8b6f38', '#ffffff'],
      });

      if (onPhotoAdded) onPhotoAdded(newPhotoObj);
      handleClose();
    } catch (err: any) {
      console.error('Erro ao salvar foto no banco de dados:', err);
      alert(`Houve um problema ao salvar a foto: ${err?.message || 'Erro de conexão'}. Por favor tente novamente!`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setDriveUrlInput('');
    setCaption('');
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fdfbf7] rounded-3xl border border-[#e2d5b6] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#e8dfd5] bg-[#faf6f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#8b6f38]" />
            <h3 className="font-serif font-bold text-[#3d3122] text-sm sm:text-base">
              {capturedImage ? 'Pré-visualização da Foto' : 'Adicionar Foto'}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-[#eae0d2] text-[#6e5d4f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        {!capturedImage && (
          <div className="flex items-center bg-[#f5eeda] border-b border-[#e2d5b6] p-1">
            <button
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-[#8b6f38] shadow-xs'
                  : 'text-[#6e5d4f] hover:text-[#3d3122]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Tirar / Enviar Foto</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('link');
                stopCamera();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'link'
                  ? 'bg-[#4285F4] text-white shadow-xs'
                  : 'text-[#6e5d4f] hover:text-[#3d3122]'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Link do Google Drive / Web</span>
            </button>
          </div>
        )}

        {/* Body Viewport */}
        <div className="relative flex-1 bg-stone-900 overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[380px]">
          {/* Visual Flash effect */}
          {flashActive && <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-150"></div>}

          {capturedImage ? (
            /* PREVIEW CAPTURED IMAGE */
            <div className="relative w-full h-full flex items-center justify-center p-2 bg-black">
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          ) : activeTab === 'link' ? (
            /* GOOGLE DRIVE / LINK SUBMISSION FORM */
            <div className="p-6 bg-[#fdfbf7] w-full h-full flex flex-col justify-center space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#4285F4] flex items-center justify-center mx-auto">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-base text-[#3d3122]">
                  Cole o Link do Google Drive
                </h4>
                <p className="text-xs text-[#7a6958]">
                  O Firebase salvará apenas o <b>link direto</b> para exibição instantânea na galeria.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#e8dfd5]">
                <div>
                  <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                    Link da Foto (Google Drive ou Web):
                  </label>
                  <input
                    type="url"
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#d4af37]/50 bg-[#fdfbf7] text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                  />
                  <p className="text-[11px] text-[#8b6f38] mt-1">
                    💡 Certifique-se que o link no Google Drive está com permissão <i>"Qualquer pessoa com o link pode ver"</i>.
                  </p>
                </div>

                {driveUrlInput.trim() && (
                  <div className="pt-2 border-t border-[#f0e6da]">
                    <p className="text-[11px] font-semibold text-[#5c4a38] mb-1">Pré-visualização do Link:</p>
                    <div className="relative aspect-video rounded-xl bg-stone-100 overflow-hidden flex items-center justify-center border border-stone-200">
                      <img
                        src={formatDriveOrImageUrl(driveUrlInput)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[11px] text-stone-400 p-2 text-center">
                        Carregando imagem do link...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : cameraError ? (
            /* CAMERA ERROR / FALLBACK */
            <div className="p-8 text-center text-white space-y-4 max-w-sm">
              <ImageIcon className="w-12 h-12 mx-auto text-amber-200/60" />
              <p className="text-sm text-amber-100">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white font-semibold text-xs transition-all shadow-md inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Escolher da Galeria</span>
              </button>
            </div>
          ) : (
            /* LIVE CAMERA STREAM */
            <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-all ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                } ${
                  filter === 'sepia'
                    ? 'sepia brightness-90'
                    : filter === 'grayscale'
                    ? 'grayscale contrast-125'
                    : filter === 'warm'
                    ? 'sepia-[0.3] saturate-150'
                    : filter === 'vintage'
                    ? 'contrast-110 brightness-95 saturate-80 sepia-[0.2]'
                    : ''
                }`}
              />

              {/* Watermark overlay on camera preview */}
              {showWatermark && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-center text-amber-100 text-xs font-serif font-semibold pointer-events-none">
                  Bianca & Pedro • 14 Anos de Amor
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-[#fdfbf7] border-t border-[#e8dfd5] space-y-3">
          {activeTab === 'link' && !capturedImage ? (
            /* LINK PUBLISH FORM */
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                    Seu Nome:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Padrinho Lucas, Tia Maria..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#d4af37]/50 bg-white text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                    Legenda ou Mensagem na Foto (opcional):
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ex: Vivas aos noivos! Bodas de Marfim!"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#d4af37]/50 bg-white text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                  />
                </div>
              </div>

              <button
                onClick={handlePublish}
                disabled={isUploading || !driveUrlInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adicionando Link...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> Registrar Link na Galeria (Firebase)
                  </span>
                )}
              </button>
            </div>
          ) : !capturedImage ? (
            /* CAMERA CAPTURE CONTROLS */
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {(
                  [
                    { id: 'normal', name: 'Normal' },
                    { id: 'warm', name: 'Romântico' },
                    { id: 'vintage', name: 'Vintage' },
                    { id: 'sepia', name: 'Sépia' },
                    { id: 'grayscale', name: 'P&B' },
                  ] as { id: FilterType; name: string }[]
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      filter === f.id
                        ? 'bg-[#8b6f38] text-white font-semibold'
                        : 'bg-[#faf6f0] border border-[#e2d5b6] text-[#6e5d4f]'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Bottom Shutter Toolbar */}
              <div className="flex items-center justify-between px-2">
                {/* File Upload Option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-[#f3e5ab]/40 hover:bg-[#f3e5ab] text-[#8b6f38] transition-colors"
                  title="Escolher do celular"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Shutter Main Button */}
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#8b6f38] p-1 shadow-lg active:scale-95 transition-transform flex items-center justify-center"
                  title="Tirar Foto"
                >
                  <div className="w-full h-full bg-white rounded-full border-2 border-[#8b6f38] flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#8b6f38] flex items-center justify-center text-white">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                </button>

                {/* Switch Camera */}
                <button
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-[#f3e5ab]/40 hover:bg-[#f3e5ab] text-[#8b6f38] transition-colors"
                  title="Inverter Câmera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW PUBLISH FORM */
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                    Seu Nome:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: Padrinho Lucas, Tia Maria..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#d4af37]/50 bg-white text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5c4a38] mb-1">
                    Legenda ou Mensagem na Foto (opcional):
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ex: Vivas aos noivos! Bodas de Marfim inesquecíveis!"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#d4af37]/50 bg-white text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {getDriveToken() && (
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center justify-between gap-1.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CloudUpload className="w-3.5 h-3.5 text-[#4285F4]" />
                      Será salvo na pasta "Bodas de Marfim - Bianca e Pedro" no Drive!
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCapturedImage(null)}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#d4af37]/40 bg-white text-[#6e5d4f] text-xs font-semibold hover:bg-stone-50 transition-colors"
                  >
                    Tirar Outra
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando foto...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" /> Salvar na Galeria
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
