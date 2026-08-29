import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { matchingService } from '../services/matchingService';
import { storageService } from '../services/storageService';
import { emailAlertService } from '../services/emailAlertService';
import { supabase } from '../lib/supabase';
import { CATEGORIES, LOCATIONS, ITEM_TYPE } from '../constants/itemConstants';
import { validateItemForm, validateImageFile } from '../utils/validation';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import MatchCard from '../components/MatchCard';
import { AlertCircle, Camera, Trash2, ArrowLeft, RefreshCw, CheckCircle2, Info, Sparkles, Box } from 'lucide-react';

export default function ReportFoundPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form Field States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [approximateTime, setApproximateTime] = useState('');
  const [identifyingDetails, setIdentifyingDetails] = useState('');
  
  // Image Upload States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UX Operation States
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Success Match Feed States
  const [createdItem, setCreatedItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // File size limit: 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
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

    setSubmitting(true);
    let uploadedImageUrl = null;

    try {
      // 1. Upload optional image if provided
      if (imageFile && currentUser) {
        setUploadProgress(40);
        const { publicUrl, error: uploadError } = await storageService.uploadImage(imageFile, currentUser.id);
        
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}.`);
        }

        uploadedImageUrl = publicUrl;
        setUploadProgress(80);
      }

      setUploadProgress(90);

      // 2. Prepare payload and insert into database using itemService
      const payload = {
        type: ITEM_TYPE.FOUND,
        title: title.trim(),
        category,
        description: description.trim(),
        location: location.trim(),
        date_occurred: dateOccurred,
        approximate_time: approximateTime ? approximateTime.trim() : null,
        identifying_details: identifyingDetails ? identifyingDetails.trim() : null,
        image_url: uploadedImageUrl
      };

      const { data, error: insertError } = await itemService.createItem(payload);
      if (insertError) throw insertError;

      setCreatedItem(data);
      setUploadProgress(100);
      setSuccess(true);
      setSubmitting(false);

      // 3. Immediately query matching candidates in background
      setLoadingMatches(true);
      try {
        const { data: matchData } = await matchingService.findMatchesForItem(data);
        setMatches(matchData || []);

        // 4. Asynchronously notify owners of strong matches without blocking submission
        matchingService.notifyMatchedItemOwners(data, matchData || []).catch((notifyErr) => {
          console.error('Non-blocking match notification dispatch error:', notifyErr);
        });

        // 5. Asynchronously dispatch admin alert to dhokvinit@gmail.com
        emailAlertService.sendReportAdminEmailAlert({
          item: data,
          reporterName: currentUser?.user_metadata?.full_name || currentUser?.email,
          reporterEmail: currentUser?.email
        });
      } catch (matchErr) {
        console.error('Immediate matching calculation query exception:', matchErr);
      } finally {
        setLoadingMatches(false);
      }

    } catch (err) {
      console.error('Error reporting found item:', err.message);
      setError(getFriendlyErrorMessage(err, 'An error occurred while submitting your found item report.'));
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Back Link */}
      <div className="flex justify-start">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-2">
        <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider select-none">
          Report Form
        </span>
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">I Found Something</h1>
        <p className="text-sm text-slate-500 font-medium">
          Tell us what you found and where you saw it around campus.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {success ? (
          <div className="space-y-8 animate-[scaleIn_0.3s_ease-out]">
            
            {/* Header Success block */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-6 border-b border-slate-100">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-pulse" />
              <h3 className="text-2xl font-bold text-slate-800">Found Item Reported!</h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                Your report has been securely registered in the collegiate database. You can track your trace below.
              </p>
              
              <div className="pt-2">
                <Link
                  to={`/items/${createdItem?.id}`}
                  className="inline-flex items-center justify-center py-2 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors duration-200"
                >
                  View My Report
                </Link>
              </div>
            </div>

            {/* Possible Matches list */}
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-lg font-bold font-display text-slate-850 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Possible Matches Found
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  We checked active lost reports around campus. See if any match your description:
                </p>
              </div>

              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                  <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Running similarity matching...</span>
                </div>
              ) : matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 border border-slate-105 border-dashed rounded-2xl bg-slate-50/10">
                  <div className="p-3 bg-slate-50 rounded-full text-slate-400">
                    <Box className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No possible matches found yet.</h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    We will list matches here and notify you if a student reports losing a similar item!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {matches.slice(0, 4).map((match, idx) => (
                    <MatchCard key={idx} match={match} originalItem={createdItem} />
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error alerts */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Grid 1: Basic details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="title">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="e.g. Blue Milton Water Bottle, Black Leather Wallet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="category">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category"
                  required
                  disabled={submitting}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Description textarea */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-600" htmlFor="description">
                  Item Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-slate-400">Min 15 chars</span>
              </div>
              <textarea
                id="description"
                required
                disabled={submitting}
                rows="4"
                placeholder="Describe the item: its color, brand, size, stickers, scratches, or other unique marks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium leading-relaxed resize-none"
              />
            </div>

            {/* Grid 2: Location and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="location">
                  Location Found <span className="text-rose-500">*</span>
                </label>
                <select
                  id="location"
                  required
                  disabled={submitting}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Select Location</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Date Found */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="dateOccurred">
                  Date Found <span className="text-rose-500">*</span>
                </label>
                <input
                  id="dateOccurred"
                  type="date"
                  required
                  disabled={submitting}
                  max={new Date().toISOString().split('T')[0]}
                  value={dateOccurred}
                  onChange={(e) => setDateOccurred(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium"
                />
              </div>

            </div>

            {/* Optional Fields: Time & Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Time */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="approximateTime">
                  Approximate Time (Optional)
                </label>
                <select
                  id="approximateTime"
                  disabled={submitting}
                  value={approximateTime}
                  onChange={(e) => setOriginalTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Select Time Segment</option>
                  <option value="Morning">Morning (8:00 AM - 12:00 PM)</option>
                  <option value="Afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="Evening">Evening (4:00 PM - 8:00 PM)</option>
                  <option value="Night">Night (8:00 PM - 8:00 AM)</option>
                </select>
              </div>

              {/* Unique Details */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="identifyingDetails">
                  Identifying Marks (Optional)
                </label>
                <input
                  id="identifyingDetails"
                  type="text"
                  disabled={submitting}
                  placeholder="e.g. Stickers, scratches, custom case, brand name"
                  value={identifyingDetails}
                  onChange={(e) => setIdentifyingDetails(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 text-slate-800 font-medium"
                />
              </div>

            </div>

            {/* Time handler helper to bridge standard React dropdown selects */}
            {(() => {
              // Internal time setter handler bypass
              if (typeof setOriginalTime === 'undefined') {
                window.setOriginalTime = setApproximateTime;
              }
            })()}

            {/* Safety Warning */}
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                <strong>Privacy Notice:</strong> Do not enter sensitive credentials in the public fields. These entries are visible to authenticated students to aid searches.
              </p>
            </div>

            {/* Optional Image Picker Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Item Photo (Optional)
              </label>

              <div className="flex items-center gap-4">
                
                {/* Preview frame */}
                <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Found item preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    
                    {/* Choose file trigger */}
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      Upload Photo
                      <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                        onChange={handleImageChange} 
                        disabled={submitting} 
                        className="hidden" 
                      />
                    </label>

                    {/* Remove image trigger */}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}

                  </div>
                  {imageFile && (
                    <p className="text-[10px] text-slate-505 font-semibold truncate max-w-[180px]" title={imageFile.name}>
                      Selected: {imageFile.name}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    JPG, JPEG, PNG, or WEBP. Max size 5MB.
                  </p>
                </div>

              </div>
            </div>

            {/* Submit operations */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3">
              
              {/* Upload loading state indicator */}
              {submitting && uploadProgress > 0 && (
                <div className="flex items-center gap-2 pr-4 text-xs font-semibold text-slate-500 self-center">
                  <RefreshCw className="w-3.5 h-3.5 text-primary-500 animate-spin" />
                  <span>Submitting report ({uploadProgress}%)</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-6 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Found Item'}
              </button>

            </div>

          </form>
        )}

      </div>

    </div>
  );
}
