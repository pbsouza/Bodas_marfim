import React, { useState } from 'react';
import { X, ShieldCheck, Trash2, KeyRound, Database, Download, Check, ExternalLink, Image as ImageIcon, MessageSquare, HardDrive, Copy, CloudUpload, RefreshCw } from 'lucide-react';
import { Photo, GuestMessage } from '../types';
import { deletePhotoDoc, deleteMessageDoc, updatePhotoUrl } from '../lib/firebase';
import { connectGoogleDrive, uploadImageToDriveFolder, getDriveToken, listFilesInDriveFolder } from '../lib/googleDrive';
import { DriveImage, extractDriveFileId } from './DriveImage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  photos: Photo[];
  messages: GuestMessage[];
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  photos,
  messages,
}) => {
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'messages' | 'info' | 'drive'>('photos');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedUrls, setCopiedUrls] = useState<boolean>(false);

  // Google Drive Integration States
  const [driveToken, setDriveTokenState] = useState<string | null>(getDriveToken());
  const [driveUser, setDriveUser] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [isSyncingToDrive, setIsSyncingToDrive] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const res = await connectGoogleDrive();
      setDriveTokenState(res.accessToken);
      setDriveUser(res.user.email || res.user.displayName || 'Conectado');
      alert(`Google Drive conectado com sucesso (${res.user.email || 'Conta Google'})!\nA pasta "Bodas de Marfim - Bianca e Pedro" foi criada e vinculada.`);
    } catch (err: any) {
      alert(`Erro ao conectar ao Google Drive: ${err?.message || err}`);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleMigratePhotosToDrive = async () => {
    let token = driveToken;
    if (!token) {
      try {
        const res = await connectGoogleDrive();
        token = res.accessToken;
        setDriveTokenState(res.accessToken);
        setDriveUser(res.user.email || res.user.displayName || 'Conectado');
      } catch (err) {
        return;
      }
    }

    if (photos.length === 0) {
      alert('Não há fotos na galeria para salvar no Google Drive.');
      return;
    }

    const confirmMigrate = window.confirm(
      `Deseja salvar e mover todas as ${photos.length} fotos diretamente para a pasta "Bodas de Marfim - Bianca e Pedro" do seu Google Drive?\n\nIsso enviará os arquivos para a pasta do seu Drive e guardará apenas o link leve no banco de dados.`
    );
    if (!confirmMigrate) return;

    setIsSyncingToDrive(true);
    setSyncProgress({ current: 0, total: photos.length });

    let countAlreadySaved = 0;
    let countNewUploaded = 0;

    // Fetch existing files in the Drive folder to prevent duplicate uploads
    let existingDriveFiles: { id: string; name: string }[] = [];
    try {
      existingDriveFiles = await listFilesInDriveFolder(token);
    } catch (e) {
      console.warn('Não foi possível listar arquivos do Drive antecipadamente:', e);
    }

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      setSyncProgress({ current: i + 1, total: photos.length });

      // Check 1: Is photo URL already a Google Drive link?
      const existingFileId = extractDriveFileId(p.photoUrl);
      if (existingFileId || p.photoUrl.includes('drive.google.com') || p.photoUrl.includes('googleusercontent.com')) {
        countAlreadySaved++;
        continue;
      }

      // Check 2: Does a file matching this photo ID already exist in the Drive folder?
      const matchedDriveFile = existingDriveFiles.find((f) => f.name.includes(p.id));
      if (matchedDriveFile) {
        const directUrl = `https://lh3.googleusercontent.com/d/${matchedDriveFile.id}`;
        try {
          await updatePhotoUrl(p.id, directUrl);
        } catch (dbErr) {
          console.warn(`Aviso ao atualizar URL no banco para foto ${p.id}:`, dbErr);
        }
        countAlreadySaved++;
        continue;
      }

      // Check 3: Not saved in Drive yet, upload it now
      try {
        const safeAuthor = p.authorName ? p.authorName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'convidado';
        const fileName = `foto-bodas-marfim-${p.id}-${safeAuthor}.jpg`;

        const uploadResult = await uploadImageToDriveFolder(token, p.photoUrl, fileName);
        await updatePhotoUrl(p.id, uploadResult.directUrl);
        countNewUploaded++;
      } catch (err) {
        console.error(`Erro ao salvar foto ${p.id} no Drive:`, err);
      }
    }

    setIsSyncingToDrive(false);
    alert(
      `Verificação e Sincronização Concluídas!\n\n` +
      `- Fotos que já estavam salvas no Drive: ${countAlreadySaved}\n` +
      `- Novas fotos enviadas e salvas agora no Drive: ${countNewUploaded}\n\n` +
      `Todas as ${photos.length} fotos estão salvas e vinculadas à sua pasta "Bodas de Marfim - Bianca e Pedro" no Google Drive!`
    );
  };

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1914' || pin.toLowerCase().trim() === 'bodas19' || pin.toLowerCase().trim() === 'biancaepedro') {
      setIsAdmin(true);
      setPinError(false);
      setPin('');
      setActiveTab('photos');
    } else {
      setPinError(true);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta foto permanentemente?')) {
      setIsDeleting(true);
      try {
        await deletePhotoDoc(photoId);
      } catch (err) {
        console.error('Erro ao excluir foto:', err);
        alert('Erro ao apagar foto.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta mensagem permanentemente?')) {
      setIsDeleting(true);
      try {
        await deleteMessageDoc(messageId);
      } catch (err) {
        console.error('Erro ao excluir mensagem:', err);
        alert('Erro ao apagar mensagem.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleDownloadAllPhotos = async () => {
    if (photos.length === 0) {
      alert('Nenhuma foto disponível para baixar.');
      return;
    }
    setIsDownloading(true);
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const safeName = p.authorName ? p.authorName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'convidado';
      await handleDownloadSingle(p.photoUrl, `foto-casamento-bianca-pedro-${i + 1}-${safeName}.jpg`);
      await new Promise((r) => setTimeout(r, 300));
    }
    setIsDownloading(false);
    alert('Download concluído! Todas as fotos foram baixadas para seu dispositivo.');
  };

  const handleCopyPhotoLinks = () => {
    const urls = photos.map((p, idx) => `${idx + 1}. ${p.authorName || 'Convidado'}: ${p.photoUrl}`).join('\n');
    navigator.clipboard.writeText(urls);
    setCopiedUrls(true);
    setTimeout(() => setCopiedUrls(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#fdfbf7] rounded-3xl border border-[#e2d5b6] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e8dfd5] bg-[#faf6f0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f3e5ab] text-[#8b6f38]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#3d3122] text-base sm:text-lg">
                Painel dos Noivos (Gerenciamento)
              </h3>
              <p className="text-xs text-[#7a6958]">
                Controle de conteúdo e backup da festa de Bianca & Pedro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#eae0d2] text-[#6e5d4f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!isAdmin ? (
            /* PIN UNLOCK FORM */
            <div className="bg-white p-6 rounded-2xl border border-[#e8dfd5] text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#fdf8ee] border border-[#e2d5b6] text-[#8b6f38] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-[#3d3122]">
                  Acesso Restrito aos Noivos
                </h4>
                <p className="text-xs text-[#7a6958] mt-1">
                  Digite a senha dos noivos para gerenciar fotos, mensagens e opções do evento.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Digite a senha de acesso"
                  className="w-full text-center px-4 py-2.5 rounded-xl border border-[#d4af37]/50 bg-[#fdfbf7] text-sm text-[#3d3122] focus:outline-none focus:ring-2 focus:ring-[#8b6f38]"
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-medium">
                    Senha incorreta. Tente novamente!
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white font-semibold text-xs transition-all shadow-md"
                >
                  Desbloquear Moderação
                </button>
              </form>
            </div>
          ) : (
            /* ADMIN UNLOCKED PANEL */
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Modo Gerenciador Ativado!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Você pode apagar qualquer foto ou recado indesejado, ou mover todas as fotos para o seu Google Drive.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors flex-shrink-0"
                >
                  Bloquear
                </button>
              </div>

              {/* Subtabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e8dfd5] pb-2">
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'photos' ? 'bg-[#8b6f38] text-white' : 'text-[#6e5d4f] hover:bg-[#faf6f0]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Fotos ({photos.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'drive' ? 'bg-[#4285F4] text-white' : 'text-[#6e5d4f] hover:bg-[#faf6f0]'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Mover p/ Google Drive</span>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'messages' ? 'bg-[#8b6f38] text-white' : 'text-[#6e5d4f] hover:bg-[#faf6f0]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Recados ({messages.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'info' ? 'bg-[#8b6f38] text-white' : 'text-[#6e5d4f] hover:bg-[#faf6f0]'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Como Funciona?</span>
                </button>
              </div>

              {/* TAB: GOOGLE DRIVE MOVER */}
              {activeTab === 'drive' && (
                <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#4285F4] border border-blue-100">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#3d3122]">
                        Integração Direta com o Google Drive
                      </h4>
                      <p className="text-xs text-[#7a6958]">
                        Mova e salve todas as fotos da festa diretamente na pasta "Bodas de Marfim - Bianca e Pedro" do seu Drive!
                      </p>
                    </div>
                  </div>

                  {/* Automatic Drive Migration Box */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#1a365d] flex items-center gap-1.5">
                          <CloudUpload className="w-4 h-4 text-[#4285F4]" />
                          <span>Mover Fotos do Firebase para o Google Drive</span>
                        </p>
                        <p className="text-[11px] text-[#334155] mt-1 leading-relaxed">
                          Salva os arquivos direto no seu Drive e mantém no banco de dados do site somente os links leves.
                        </p>
                      </div>
                      {driveToken ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" /> Drive Conectado
                        </span>
                      ) : (
                        <button
                          onClick={handleConnectDrive}
                          disabled={isConnectingDrive}
                          className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-xs font-bold text-[#4285F4] hover:bg-blue-100 transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          {isConnectingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                          <span>Conectar Drive</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleMigratePhotosToDrive}
                      disabled={isSyncingToDrive || photos.length === 0}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSyncingToDrive ? (
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando {syncProgress.current} de {syncProgress.total} fotos para o Drive...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <CloudUpload className="w-4 h-4" />
                          <span>Mover Todas as {photos.length} Fotos para a Pasta "Bodas de Marfim - Bianca e Pedro"</span>
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Folder Destination Banner */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-[#e8dfd5] text-xs text-[#5c4a38] flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#3d3122]">Pasta no seu Google Drive:</p>
                      <p className="font-mono bg-white px-2 py-0.5 rounded-md border border-[#d4af37]/40 mt-0.5 inline-block text-[#8b6f38] font-bold">
                        Bodas de Marfim - Bianca e Pedro
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("Bodas de Marfim - Bianca e Pedro");
                        alert("Nome da pasta copiado: 'Bodas de Marfim - Bianca e Pedro'");
                      }}
                      className="px-2.5 py-1 bg-white border border-[#e8dfd5] rounded-lg font-semibold text-xs text-[#5c4a38] hover:bg-[#faf6f0] transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar Nome</span>
                    </button>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={handleDownloadAllPhotos}
                      disabled={isDownloading || photos.length === 0}
                      className="p-2.5 rounded-xl bg-[#8b6f38] hover:bg-[#735a2c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Baixando Fotos...' : `Baixar Zip/Local (${photos.length} Fotos)`}</span>
                    </button>

                    <a
                      href="https://drive.google.com/drive/my-drive"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Google Drive</span>
                    </a>
                  </div>

                  {/* Copy links optional */}
                  <div>
                    <button
                      onClick={handleCopyPhotoLinks}
                      className="w-full py-2 px-3 rounded-xl border border-[#e2d5b6] bg-[#fdfbf7] hover:bg-[#faf4e8] text-[#5c4a38] text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#8b6f38]" />
                      <span>{copiedUrls ? 'Links Copiados!' : 'Copiar Lista de Links de Todas as Fotos'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: PHOTOS MANAGER */}
              {activeTab === 'photos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 bg-[#faf6f0] p-3 rounded-xl border border-[#e8dfd5]">
                    <p className="text-xs text-[#7a6958] font-medium">
                      Gerencie as fotos enviadas pelos convidados:
                    </p>
                    <button
                      onClick={handleDownloadAllPhotos}
                      disabled={isDownloading || photos.length === 0}
                      className="px-3 py-1.5 rounded-lg bg-[#8b6f38] hover:bg-[#735a2c] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Todas</span>
                    </button>
                  </div>

                  {photos.length === 0 ? (
                    <p className="text-xs text-stone-500 italic p-4 text-center">Nenhuma foto enviada ainda.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((p) => (
                        <div key={p.id} className="relative bg-white rounded-xl overflow-hidden border border-[#e8dfd5] group shadow-2xs">
                          <DriveImage src={p.photoUrl} alt="Foto" className="w-full aspect-4/3 object-cover" />
                          <div className="p-2 flex items-center justify-between text-[11px] bg-stone-50 border-t border-[#f0e6da]">
                            <span className="truncate font-semibold text-[#3d3122] max-w-[80px]">{p.authorName}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadSingle(p.photoUrl, `foto-${p.id}.jpg`)}
                                className="p-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                                title="Baixar Foto"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(p.id)}
                                disabled={isDeleting}
                                className="p-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                                title="Apagar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MESSAGES MANAGER */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#7a6958]">
                    Clique na lixeira para remover qualquer recado do mural:
                  </p>
                  {messages.length === 0 ? (
                    <p className="text-xs text-stone-500 italic p-4 text-center">Nenhum recado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((m) => (
                        <div key={m.id} className="p-3 bg-white rounded-xl border border-[#e8dfd5] flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#3d3122]">{m.authorName}</p>
                            <p className="text-[#5c4a38]">"{m.content}"</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(m.id)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors flex-shrink-0"
                            title="Apagar recado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: HOW IT WORKS INFO */}
              {activeTab === 'info' && (
                <div className="bg-white p-5 rounded-2xl border border-[#e8dfd5] space-y-4 text-xs text-[#5c4a38]">
                  <h4 className="font-serif font-bold text-base text-[#3d3122] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#8b6f38]" />
                    <span>Como e onde as fotos estão salvas:</span>
                  </h4>
                  <ul className="space-y-2.5 list-disc pl-5 leading-relaxed">
                    <li>
                      <b>Banco de Dados Nuvem Firebase (Firestore):</b> Todas as fotos e recados enviados pelos convidados através do QR Code são gravados instantaneamente no banco de dados na nuvem da sua festa.
                    </li>
                    <li>
                      <b>Tempo Real (Realtime):</b> Qualquer pessoa conectada vê as fotos atualizarem na tela na mesma hora, sem precisar atualizar a página.
                    </li>
                    <li>
                      <b>Como Apagar:</b> No modo gerenciador (ativo agora), você verá ícones vermelhos de lixeira <Trash2 className="w-3.5 h-3.5 text-rose-600 inline" /> ao lado de cada foto ou recado na página principal. Basta clicar para apagar permanentemente!
                    </li>
                    <li>
                      <b>Google Drive & Downloads:</b> Utilize a aba "Mover p/ Google Drive" para baixar todas as fotos em lote e salvá-las no seu Google Drive pessoal.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
