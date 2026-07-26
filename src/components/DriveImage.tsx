import React, { useState } from 'react';

interface DriveImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
}

// Extract Google Drive File ID if present
export const extractDriveFileId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();

  // Match lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // Match drive.google.com/file/d/FILE_ID
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) return driveFileMatch[1];

  // Match drive.google.com/(open|uc|thumbnail)?id=FILE_ID
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) return driveIdMatch[1];

  return null;
};

// Returns primary and fallback URLs for Google Drive images
export const getDriveImageUrls = (url: string): { primary: string; fallback: string; raw: string } => {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return {
      primary: `https://lh3.googleusercontent.com/d/${fileId}`,
      fallback: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      raw: url,
    };
  }
  return { primary: url, fallback: url, raw: url };
};

export const DriveImage: React.FC<DriveImageProps> = ({ src, alt, className = '', loading = 'lazy', onClick }) => {
  const { primary, fallback } = getDriveImageUrls(src);
  const [imgSrc, setImgSrc] = useState<string>(primary);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (imgSrc === primary && primary !== fallback) {
      // Try fallback URL (thumbnail API)
      setImgSrc(fallback);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    const fileId = extractDriveFileId(src);
    return (
      <div
        onClick={onClick}
        className={`bg-stone-100 flex flex-col items-center justify-center p-3 text-center border border-stone-200 text-stone-600 font-sans text-xs ${className}`}
      >
        <span className="font-semibold text-stone-700">Imagem do Google Drive</span>
        {fileId ? (
          <a
            href={`https://drive.google.com/file/d/${fileId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 text-[11px] text-[#4285F4] font-bold underline hover:text-[#3367D6]"
          >
            Abrir foto no Drive
          </a>
        ) : (
          <span className="text-[10px] text-stone-400 mt-0.5">Sem permissão de visualização</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={handleError}
      onClick={onClick}
    />
  );
};
