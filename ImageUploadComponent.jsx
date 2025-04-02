import React, { useState, useRef } from 'react';
import { Camera, X, Upload, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

/**
 * A reusable image upload component with drag and drop functionality
 * and enhanced image deletion capabilities
 * 
 * @param {Object} props
 * @param {Array} props.images - Array of current image files
 * @param {Array} props.imagePreviewUrls - Array of image preview URLs
 * @param {Function} props.onImagesChanged - Callback when images change
 * @param {Function} props.onImageDelete - Callback for when an image needs to be deleted from server (for submitted images)
 * @param {Array} props.submittedImages - Array of already submitted image URLs
 * @param {number} props.maxSize - Maximum file size in MB (default: 10)
 * @param {number} props.maxFiles - Maximum number of files (default: 5)
 */
const ImageUploadComponent = ({ 
  images = [], 
  imagePreviewUrls = [], 
  onImagesChanged,
  onImageDelete,
  submittedImages = [],
  maxSize = 10, 
  maxFiles = 5,
  isSubmitted = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
  const [isSubmittedImage, setIsSubmittedImage] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files));
    }
  };
  
  // Handle drag over event
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Handle drag leave event
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };
  
  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  // Process files and validate them
  const handleFileSelection = (filesArray) => {
    // Clear previous error message
    setUploadError(null);
    
    // Check if adding these files would exceed the maximum
    if (images.length + submittedImages.length + filesArray.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} images`);
      return;
    }
    
    // Validate file types and sizes
    const validFiles = [];
    const validPreviewUrls = [];
    let hasError = false;
    
    filesArray.forEach(file => {
      // Check if it's an image file
      const isImage = file.type.startsWith('image/');
      
      // Check size (default 10MB limit)
      const isUnderSizeLimit = file.size <= maxSize * 1024 * 1024;
      
      if (!isImage) {
        setUploadError('Only image files are allowed');
        hasError = true;
      } else if (!isUnderSizeLimit) {
        setUploadError(`Files must be under ${maxSize}MB`);
        hasError = true;
      } else {
        validFiles.push(file);
        validPreviewUrls.push(URL.createObjectURL(file));
      }
    });
    
    // Only update if we have valid files and no errors
    if (validFiles.length > 0 && !hasError) {
      onImagesChanged({
        images: [...images, ...validFiles],
        imagePreviewUrls: [...imagePreviewUrls, ...validPreviewUrls]
      });
      
      // Show success message briefly
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
      }, 2000);
    }
  };
  
  // Show confirmation dialog for image deletion
  const confirmImageDelete = (index, isSubmitted = false, imageUrl = null) => {
    setImageToDelete(imageUrl);
    setImageIndexToDelete(index);
    setIsSubmittedImage(isSubmitted);
    setShowDeleteConfirm(true);
  };
  
  // Cancel delete operation
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setImageToDelete(null);
    setImageIndexToDelete(null);
    setIsSubmittedImage(false);
  };
  
  // Execute image deletion
  const executeDelete = () => {
    if (isSubmittedImage) {
      // For server-side images, call the provided callback
      if (onImageDelete) {
        onImageDelete(imageToDelete, imageIndexToDelete);
      }
    } else {
      // For local images not yet submitted
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(imagePreviewUrls[imageIndexToDelete]);
      
      // Remove image from both arrays
      const updatedImages = [...images];
      updatedImages.splice(imageIndexToDelete, 1);
      
      const updatedPreviews = [...imagePreviewUrls];
      updatedPreviews.splice(imageIndexToDelete, 1);
      
      onImagesChanged({
        images: updatedImages,
        imagePreviewUrls: updatedPreviews
      });
    }
    
    // Reset confirmation dialog state
    setShowDeleteConfirm(false);
    setImageToDelete(null);
    setImageIndexToDelete(null);
    setIsSubmittedImage(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <Trash2 size={48} />
            </div>
            <h3 className="text-xl font-semibold text-center mb-4">Delete Image?</h3>
            <p className="text-gray-600 mb-6 text-center">
              {isSubmittedImage 
                ? "This action will permanently delete the image from the maintenance request."
                : "Are you sure you want to remove this image?"}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File upload area - only show if not at max files */}
      {(images.length + submittedImages.length < maxFiles) && (
        <div 
          className={`border-2 border-dashed rounded-lg transition-colors duration-200 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="px-6 py-8 text-center">
            <Camera size={36} className="mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">
              {isDragging ? 'Drop images here' : 'Drag and drop images here'}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB ({images.length + submittedImages.length}/{maxFiles} files)
            </p>
            
            <div className="mt-4">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleBrowseClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Upload size={16} className="mr-2" />
                Browse for files
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={16} className="text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}
      
      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-lg">
          <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-700">Images uploaded successfully</p>
        </div>
      )}
      
      {/* Already Submitted Images (if any) */}
      {submittedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Images ({submittedImages.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {submittedImages.map((url, index) => (
              <div key={`submitted-${index}`} className="relative group">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img 
                    src={url} 
                    alt={`Submitted ${index}`}
                    className="h-full w-full object-cover" 
                  />
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => confirmImageDelete(index, true, url)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Image Previews for current upload */}
      {imagePreviewUrls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {submittedImages.length > 0 ? 'New Images' : 'Selected Images'} ({imagePreviewUrls.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imagePreviewUrls.map((url, index) => (
              <div key={`preview-${index}`} className="relative group">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img 
                    src={url} 
                    alt={`Preview ${index}`}
                    className="h-full w-full object-cover" 
                  />
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => confirmImageDelete(index, false)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadComponent;