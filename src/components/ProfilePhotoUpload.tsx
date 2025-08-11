import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, User } from 'lucide-react';

interface ProfilePhotoUploadProps {
  currentPhotoURL?: string;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  userName: string;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoURL,
  onUpload,
  onDelete,
  userName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      return;
    }

    setIsUploading(true);
    try {
      const success = await onUpload(file);
      if (success) {
        // Success feedback will be handled by parent component
      } else {
        alert('Fotoğraf yüklenirken hata oluştu.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fotoğraf yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Profil fotoğrafınızı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await onDelete();
      if (success) {
        // Success feedback will be handled by parent component
      } else {
        alert('Fotoğraf silinirken hata oluştu.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fotoğraf silinirken hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Photo Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {currentPhotoURL ? (
            <img
              src={currentPhotoURL}
              alt={`${userName} profil fotoğrafı`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${currentPhotoURL ? 'hidden' : ''}`}>
            <User className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        
        {/* Camera Icon Overlay */}
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          title="Fotoğraf değiştir"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center text-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
        </button>
        
        {currentPhotoURL && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center text-sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Siliniyor...' : 'Sil'}
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        JPG, PNG veya GIF formatında, maksimum 5MB boyutunda fotoğraf yükleyebilirsiniz.
      </p>
    </div>
  );
};

export default ProfilePhotoUpload;