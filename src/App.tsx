import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LoveMilestone } from './components/LoveMilestone';
import { PhotoGallery } from './components/PhotoGallery';
import { MessageWall } from './components/MessageWall';
import { QRCodeModal } from './components/QRCodeModal';
import { CameraModal } from './components/CameraModal';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { Photo, GuestMessage } from './types';
import { getPhotosOnce, getMessagesOnce, deletePhotoDoc, deleteMessageDoc } from './lib/firebase';
import { Camera, QrCode } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'messages' | 'story'>('story');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState<boolean>(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
  const [photosLoaded, setPhotosLoaded] = useState<boolean>(false);
  const [messagesLoaded, setMessagesLoaded] = useState<boolean>(false);

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Load photos on demand
  const handleRefreshPhotos = useCallback(async (force = false) => {
    setIsPhotosLoading(true);
    try {
      const fetched = await getPhotosOnce(force);
      setPhotos(fetched);
      setPhotosLoaded(true);
    } finally {
      setIsPhotosLoading(false);
    }
  }, []);

  // Load messages on demand
  const handleRefreshMessages = useCallback(async (force = false) => {
    setIsMessagesLoading(true);
    try {
      const fetched = await getMessagesOnce(force);
      setMessages(fetched);
      setMessagesLoaded(true);
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  // Fetch photos when gallery tab is opened or camera / admin modal is opened
  useEffect(() => {
    if ((activeTab === 'gallery' || isAdminModalOpen) && !photosLoaded) {
      handleRefreshPhotos(false);
    }
  }, [activeTab, isAdminModalOpen, photosLoaded, handleRefreshPhotos]);

  // Fetch messages when messages tab is opened or admin modal is opened
  useEffect(() => {
    if ((activeTab === 'messages' || isAdminModalOpen) && !messagesLoaded) {
      handleRefreshMessages(false);
    }
  }, [activeTab, isAdminModalOpen, messagesLoaded, handleRefreshMessages]);

  const handleDeletePhoto = async (photoId: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta foto da galeria?')) {
      try {
        await deletePhotoDoc(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } catch (err) {
        console.error('Erro ao excluir foto:', err);
        alert('Erro ao excluir a foto. Tente novamente.');
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta mensagem do mural?')) {
      try {
        await deleteMessageDoc(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        console.error('Erro ao excluir mensagem:', err);
        alert('Erro ao excluir a mensagem. Tente novamente.');
      }
    }
  };

  const handlePhotoAdded = (newPhoto?: Photo) => {
    if (newPhoto) {
      setPhotos((prev) => [newPhoto, ...prev.filter((p) => p.id !== newPhoto.id)]);
    } else {
      handleRefreshPhotos(true);
    }
    setActiveTab('gallery');
  };

  const handleMessageAdded = (newMsg: GuestMessage) => {
    setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#3d3122] flex flex-col font-sans selection:bg-[#f3e5ab] selection:text-[#8b6f38]">
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRCode={() => setIsQRCodeOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isAdmin={isAdmin}
        photosCount={photos.length}
        messagesCount={messages.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'story' && (
          <LoveMilestone
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenMessage={() => setActiveTab('messages')}
            photosCount={photos.length}
            messagesCount={messages.length}
          />
        )}

        {activeTab === 'gallery' && (
          <PhotoGallery
            photos={photos}
            onOpenCamera={() => setIsCameraOpen(true)}
            isAdmin={isAdmin}
            onDeletePhoto={handleDeletePhoto}
            onRefreshPhotos={() => handleRefreshPhotos(true)}
            isLoading={isPhotosLoading}
          />
        )}

        {activeTab === 'messages' && (
          <MessageWall
            messages={messages}
            isAdmin={isAdmin}
            onDeleteMessage={handleDeleteMessage}
            onRefreshMessages={() => handleRefreshMessages(true)}
            isLoading={isMessagesLoading}
            onMessageAdded={handleMessageAdded}
          />
        )}
      </main>

      {/* Floating Camera Button for Mobile Ease of Use */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          onClick={() => setIsCameraOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#8b6f38] via-[#a38345] to-[#d4af37] text-white shadow-xl flex items-center justify-center border-2 border-white active:scale-95 transition-transform"
          aria-label="Tirar Foto"
        >
          <Camera className="w-6 h-6 text-amber-100" />
        </button>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
      />

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoAdded={handlePhotoAdded}
      />

      {/* Admin / Moderation Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        photos={photos}
        messages={messages}
      />

      {/* Footer */}
      <Footer
        onOpenCamera={() => setIsCameraOpen(true)}
        onOpenQRCode={() => setIsQRCodeOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />
    </div>
  );
}
