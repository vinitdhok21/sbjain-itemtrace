import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { storageService } from '../services/storageService';
import { CATEGORIES, LOCATIONS } from '../constants/itemConstants';
import { validateItemForm, validateImageFile } from '../utils/validation';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { ArrowLeft, Save, AlertCircle, RefreshCw, CheckCircle2, Camera, Trash2 } from 'lucide-react';

export default function EditReportPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Page operation states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Form field states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [identifyingDetails, setIdentifyingDetails] = useState('');

  // Image Upload and Management states
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [oldImageUrl, setOldImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // File validation limits
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, error: fetchError } = await itemService.getItemById(id);
        if (fetchError) throw fetchError;

        if (!data) {
          setError('Reported item not found.');
          return;
        }

        // Verify report is active
        if (data.status !== 'active') {
          setError('This report is inactive and cannot be edited.');
          setIsOwner(false);
          return;
        }

        // Enforce owner verification check
        if (currentUser && data.reported_by !== currentUser.id) {
          setError('Access Denied. You do not have permission to edit this report.');
          setIsOwner(false);
          return;
        }

        setIsOwner(true);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setLocation(data.location || '');
        setCurrentImageUrl(data.image_url || '');
        setOldImageUrl(data.image_url || '');
        
        if (data.date_occurred) {
          // Format Date to YYYY-MM-DD for date picker input value
          const formattedDate = new Date(data.date_occurred).toISOString().split('T')[0];
          setDateOccurred(formattedDate);
        }
        
        setIdentifyingDetails(data.identifying_details || '');
      } catch (err) {
        console.error('Error fetching item for editing:', err.message);
        setError(err.message || 'Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };

    if (id && currentUser) {
      fetchItemDetails();
    }
  }, [id, currentUser]);

  const handleImageChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    const { isValid, error: imgError } = validateImageFile(file);
    if (!isValid) {
      setError(imgError);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageRemoved(false);
  };

  const handleRemoveImageClick = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmRemoveImage = () => {
    setImageRemoved(true);
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setCurrentImageUrl('');
    setIsConfirmOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Standardized Form Validation
    const { isValid, errors } = validateItemForm({
      title,
      category,
      location,
      dateOccurred,
      description,
      identifyingDetails
    });

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      setError(firstError || 'Please check all required fields.');
      return;
    }

    try {
      setSaving(true);
      let uploadedImageUrl = null;
      let isNewUpload = false;

      // 1. Handle File Upload if new file selected
      if (imageFile && currentUser) {
        setUploadProgress(40);
        const { publicUrl, error: uploadError } = await storageService.uploadImage(imageFile, currentUser.id);
        
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}. Make sure your storage configuration is correct.`);
        }

        uploadedImageUrl = publicUrl;
        isNewUpload = true;
        setUploadProgress(80);
      }

      // 2. Prepare payload
      const updateData = {
        title: title.trim(),
        category,
        description: description.trim(),
        location,
        date_occurred: dateOccurred,
        identifying_details: identifyingDetails.trim() || null
      };

      // Determine image_url updates
      if (imageRemoved) {
        updateData.image_url = null;
      } else if (isNewUpload) {
        updateData.image_url = uploadedImageUrl;
      }

      // 3. Save to database
      const { error: updateError } = await itemService.updateItem(id, updateData);
      
      if (updateError) {
        // DB update failed: rollback newly uploaded image if applicable
        if (isNewUpload && uploadedImageUrl) {
          storageService.deleteImage(uploadedImageUrl).catch((rollbackErr) => {
            console.error('Failed to rollback orphaned new image upload:', rollbackErr.message);
          });
        }
        throw updateError;
      }

      setUploadProgress(100);

      // 4. Safely clean up old storage image file if it was replaced or removed
      if ((imageRemoved || isNewUpload) && oldImageUrl) {
        storageService.deleteImage(oldImageUrl).catch((cleanupErr) => {
          console.error('Non-blocking storage cleanup failure on old image replacement:', cleanupErr.message);
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-reports');
      }, 1500);
    } catch (err) {
      console.error('Error updating report details:', err.message);
      setError(err.message || 'Failed to update report.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading report details...</p>
      </div>
    );
  }

  if (error && !isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-full text-rose-500 w-fit mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {error}
        </p>
        <div>
          <Link
            to="/my-reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header toolbar */}
      <div className="flex items-center gap-3">
        <Link
          to="/my-reports"
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Report</h1>
          <p className="text-xs text-slate-500">Update details of your reported item.</p>
        </div>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm font-semibold animate-[slideIn_0.3s_ease-out]">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Report updated successfully! Redirecting back...</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Title input field */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
            Item Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            placeholder="e.g., Blue Milton Water Bottle"
            className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800"
          />
        </div>

        {/* Category & Location grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1.5">
            <label htmlFor="category" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800"
            >
              <option value="" disabled>Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
              Location <span className="text-rose-500">*</span>
            </label>
            <select
              id="location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800"
            >
              <option value="" disabled>Select Location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Date occurred date picker */}
        <div className="space-y-1.5">
          <label htmlFor="dateOccurred" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
            Date Occurred <span className="text-rose-500">*</span>
          </label>
          <input
            id="dateOccurred"
            type="date"
            required
            value={dateOccurred}
            onChange={(e) => setDateOccurred(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800"
          />
        </div>

        {/* Description textarea */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            rows="3"
            placeholder="Provide a detailed description of the item (minimum 15 characters)..."
            className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 resize-none leading-relaxed"
          />
        </div>

        {/* Identifying markings details textarea */}
        <div className="space-y-1.5">
          <label htmlFor="identifyingDetails" className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
            Identifying Marks / Distinct Details (Optional)
          </label>
          <textarea
            id="identifyingDetails"
            value={identifyingDetails}
            onChange={(e) => setIdentifyingDetails(e.target.value)}
            disabled={saving}
            rows="2"
            placeholder="e.g., Scratches near logo, stickers attached, brand name..."
            className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 resize-none leading-relaxed"
          />
        </div>

        {/* Optional Image Picker Section */}
        <div className="space-y-2 pt-3 border-t border-slate-50">
          <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
            Item Photo
          </label>

          <div className="flex items-center gap-4">
            
            {/* Preview frame */}
            <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Item preview" className="w-full h-full object-cover" />
              ) : currentImageUrl ? (
                <img src={currentImageUrl} alt="Current item" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-300" />
              )}
            </div>

            <div className="space-y-1.5 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Choose file trigger */}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  {currentImageUrl || imagePreview ? 'Replace Photo' : 'Upload Photo'}
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/webp" 
                    onChange={handleImageChange} 
                    disabled={saving} 
                    className="hidden" 
                  />
                </label>

                {/* Remove image trigger */}
                {(currentImageUrl || imagePreview) && (
                  <button
                    type="button"
                    onClick={handleRemoveImageClick}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}

              </div>
              
              {imageFile && (
                <p className="text-[10px] text-slate-505 font-semibold truncate max-w-[200px]" title={imageFile.name}>
                  Selected: {imageFile.name}
                </p>
              )}

              <p className="text-[10px] text-slate-400">
                JPG, JPEG, PNG, or WEBP. Max size 5MB.
              </p>
            </div>

          </div>
        </div>

        {/* Upload progress state indicator */}
        {saving && uploadProgress > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 text-primary-500 animate-spin" />
            <span>Uploading photo ({uploadProgress}%)</span>
          </div>
        )}

        {/* Action controls toolbar */}
        <div className="flex gap-3 pt-3 border-t border-slate-50">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate('/my-reports')}
            className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all text-center cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving || success}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-primary-500 hover:bg-primary-650 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </button>
        </div>

      </form>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Remove item photo?"
        message="This will remove the photo from your report. This action cannot be undone once changes are saved."
        confirmText="Confirm Removal"
        cancelText="Cancel"
        onConfirm={handleConfirmRemoveImage}
        onCancel={() => setIsConfirmOpen(false)}
        theme="rose"
      />

    </div>
  );
}
