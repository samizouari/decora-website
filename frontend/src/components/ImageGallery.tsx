import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrls } from '../config/api';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt, className = '' }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Convertir les chemins d'images en URLs complètes
  const fullImageUrls = getImageUrls(images);

  if (!fullImageUrls || fullImageUrls.length === 0) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Aucune image</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? fullImageUrls.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === fullImageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentImage = fullImageUrls[currentImageIndex];
  const isPDF = currentImage?.toLowerCase().endsWith('.pdf');

  return (
    <div className={`relative ${className}`}>
      {/* Image principale */}
      <div className="relative overflow-hidden rounded-lg">
        {isPDF ? (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">Document PDF</p>
              <a 
                href={currentImage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ouvrir le PDF
              </a>
            </div>
          </div>
        ) : (
          <img
            src={currentImage}
            alt={`${alt} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Erreur de chargement de l\'image:', currentImage);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        
        {/* Navigation par flèches */}
        {fullImageUrls.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Indicateur d'images */}
        {fullImageUrls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {fullImageUrls.length}
          </div>
        )}
      </div>
      
      {/* Miniatures */}
      {fullImageUrls.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {fullImageUrls.map((image, index) => {
            const isThumbnailPDF = image?.toLowerCase().endsWith('.pdf');
            return (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                  index === currentImageIndex 
                    ? 'border-blue-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {isThumbnailPDF ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-medium">PDF</span>
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`${alt} - Miniature ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Erreur de chargement de la miniature:', image);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
