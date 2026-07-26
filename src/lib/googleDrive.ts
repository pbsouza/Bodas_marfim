import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

const DRIVE_FOLDER_NAME = 'Bodas de Marfim - Bianca e Pedro';
let cachedDriveToken: string | null = null;
let cachedDriveFolderId: string | null = null;

export const setDriveToken = (token: string | null) => {
  cachedDriveToken = token;
};

export const getDriveToken = (): string | null => {
  return cachedDriveToken;
};

// Sign in with Google Auth requesting Google Drive file access scope
export const connectGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }

    cachedDriveToken = token;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Erro ao conectar Google Drive:', error);
    throw error;
  }
};

// Search or create folder "Bodas de Marfim - Bianca e Pedro" in Google Drive
export const getOrCreateDriveFolder = async (accessToken: string): Promise<string> => {
  if (cachedDriveFolderId) {
    return cachedDriveFolderId;
  }

  // 1. Search for existing folder
  const query = encodeURIComponent(
    `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Erro ao buscar pasta no Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    cachedDriveFolderId = searchData.files[0].id;
    return searchData.files[0].id;
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar pasta no Drive: ${errText}`);
  }

  const newFolder = await createRes.json();
  cachedDriveFolderId = newFolder.id;
  return newFolder.id;
};

export interface DriveFileItem {
  id: string;
  name: string;
}

// List all files in the designated Google Drive folder
export const listFilesInDriveFolder = async (accessToken: string): Promise<DriveFileItem[]> => {
  try {
    const folderId = await getOrCreateDriveFolder(accessToken);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1000`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.warn('Erro ao listar arquivos da pasta do Drive:', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Falha ao obter lista de arquivos do Drive:', err);
    return [];
  }
};

// Convert Base64 / Data URL to Blob
const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Upload an image file or base64 to Google Drive folder and set public read permission
export const uploadImageToDriveFolder = async (
  accessToken: string,
  imageInput: string | Blob,
  fileName: string
): Promise<{ fileId: string; directUrl: string }> => {
  const folderId = await getOrCreateDriveFolder(accessToken);

  let imageBlob: Blob;
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) {
      imageBlob = dataURLtoBlob(imageInput);
    } else {
      // Fetch if it's an external URL
      const resp = await fetch(imageInput);
      imageBlob = await resp.blob();
    }
  } else {
    imageBlob = imageInput;
  }

  // Multipart upload
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', imageBlob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Erro ao fazer upload para o Google Drive: ${errText}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id;

  // Make file publicly readable so it displays directly in <img> tags
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Aviso de permissão no Google Drive:', permErr);
  }

  // Direct CDN view link
  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  return { fileId, directUrl };
};
