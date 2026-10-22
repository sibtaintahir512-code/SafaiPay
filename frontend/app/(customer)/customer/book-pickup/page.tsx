'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Sparkles, AlertCircle, Upload, X, Loader2 } from 'lucide-react';
import { createPickup, classifyWasteAI, getMaterialRates, uploadFile } from '@/lib/api';

const defaultMaterials = [
  { code: 'PET_PLASTIC', name: 'PET Plastic', rate: 'Rs 85.00/kg' },
  { code: 'MIXED_PLASTIC', name: 'Mixed Plastic', rate: 'Rs 55.00/kg' },
  { code: 'CARDBOARD_OCC', name: 'Cardboard (OCC)', rate: 'Rs 42.00/kg' },
  { code: 'MIXED_METAL', name: 'Mixed Metal', rate: 'Rs 180.00/kg' },
  { code: 'GLASS_BOTTLES', name: 'Glass Bottles', rate: 'Rs 15.00/kg' },
  { code: 'E_WASTE', name: 'E-Waste', rate: 'Rs 220.00/kg' },
  { code: 'ORGANIC_WASTE', name: 'Organic Waste', rate: 'Rs 8.00/kg' },
  { code: 'NON_RECYCLABLE', name: 'Non-Recyclable', rate: 'Rs 0.00/kg' },
];

export default function BookPickupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [material, setMaterial] = useState('PET_PLASTIC');
  const [weight, setWeight] = useState(15);
  const [address, setAddress] = useState('Falcon Complex, PECHS Block 6, Karachi');
  const [preferredTime, setPreferredTime] = useState('Morning (09:00 - 12:00)');
  const [notes, setNotes] = useState('Clean sorted recyclables ready for pickup');

  // Real Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [aiMatched, setAiMatched] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dynamicMaterials, setDynamicMaterials] = useState<Array<{ code: string; name: string; rate: string }>>([]);

  useEffect(() => {
    getMaterialRates()
      .then((rates) => {
        if (rates && rates.length > 0) {
          const mapped = rates.map((r) => ({
            code: r.code,
            name: r.name,
            rate: `Rs ${Number(r.benchmark_rate_pkr).toFixed(2)}/kg`,
          }));
          setDynamicMaterials(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Selected image exceeds maximum allowed limit of 10 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // AI Classification Pre-Screening
    try {
      const aiRes = await classifyWasteAI(material);
      if (aiRes?.predicted_material) {
        setAiMatched(aiRes.predicted_material);
        setMaterial(aiRes.predicted_material);
      }
    } catch {}
  };

  const removePhoto = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setAiMatched(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      let uploadedPhotoUrl: string | undefined = undefined;

      // 1. Upload photo to real backend storage if attached
      if (selectedFile) {
        setUploadProgress(40);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('image_type', 'customer_upload');

        const uploadRes = await uploadFile(formData);
        uploadedPhotoUrl = uploadRes.file_url;
        setUploadProgress(100);
      }

      // 2. Submit pickup job to backend database
      await createPickup({
        material_code: material,
        estimated_quantity_kg: weight,
        street_address: address,
        city: 'Karachi',
        preferred_time: preferredTime,
        photo_url: uploadedPhotoUrl,
        notes,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/customer/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit pickup request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayMaterials = dynamicMaterials.length > 0 ? dynamicMaterials : defaultMaterials;

  return (
    <ProtectedRoute allowedRole="customer">
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-theme-secondary hover:text-theme-primary mb-6 transition min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-theme-surface rounded-3xl border border-theme-border p-6 sm:p-8 shadow-xs transition-colors">
            <h1 className="text-2xl font-extrabold text-theme-text mb-1">Book a Recyclable Pickup</h1>
            <p className="text-xs text-theme-secondary mb-6">
              Verified doorstep collection with certified digital weighing scale and real-time collector tracking.
            </p>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-theme-error rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {success ? (
              <div className="p-6 bg-theme-soft-mint border border-theme-border rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-theme-primary mx-auto" />
                <h3 className="text-base font-extrabold text-theme-text">Pickup Booked Successfully!</h3>
                <p className="text-xs text-theme-secondary">
                  Job created in database and broadcast to nearby collectors. Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-2">
                    1. Material Stream
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {displayMaterials.map((m) => (
                      <div
                        key={m.code}
                        onClick={() => setMaterial(m.code)}
                        className={`p-3.5 rounded-2xl border text-center cursor-pointer transition ${
                          material === m.code
                            ? 'bg-theme-soft-mint border-theme-primary ring-2 ring-theme-primary/20'
                            : 'bg-theme-surface border-theme-border hover:border-theme-primary/40'
                        }`}
                      >
                        <p className="text-xs font-bold text-theme-text">{m.name}</p>
                        <p className="text-xs font-mono font-extrabold text-theme-primary mt-1">{m.rate}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary">
                      2. Estimated Quantity (kg)
                    </label>
                    <span className="text-sm font-mono font-bold text-theme-primary bg-theme-soft-mint px-2.5 py-0.5 rounded-md border border-theme-border">
                      {weight} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full accent-theme-primary h-2 bg-theme-bg rounded-lg cursor-pointer"
                  />
                </div>

                {/* Real Photo Upload & Evidence */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-theme-secondary">
                      3. Waste Photo Evidence (Cloud Storage)
                    </label>
                    <span className="text-[11px] text-theme-primary font-bold bg-theme-soft-mint px-2 py-0.5 rounded border border-theme-border">
                      Attached to Job
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    <div className="border border-theme-border bg-theme-bg rounded-2xl p-4 space-y-3">
                      <div className="flex items-center space-x-4">
                        <img
                          src={previewUrl}
                          alt="Waste preview"
                          className="w-20 h-20 rounded-xl object-cover border border-theme-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-theme-text truncate">{selectedFile?.name}</p>
                          <p className="text-[11px] text-theme-secondary">
                            {(Number(selectedFile?.size || 0) / 1024).toFixed(1)} KB - Ready for upload
                          </p>
                          {aiMatched && (
                            <div className="flex items-center gap-1.5 text-[11px] text-theme-primary font-bold mt-1">
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>AI Classification: {aiMatched.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="p-2 text-theme-secondary hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-theme-border h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-theme-primary h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-theme-border hover:border-theme-primary/50 bg-theme-bg rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
                    >
                      <Camera className="w-8 h-8 text-theme-primary mx-auto" />
                      <p className="text-xs font-bold text-theme-text">Click or tap to upload photo / capture image</p>
                      <p className="text-[11px] text-theme-secondary">
                        Supports JPG, PNG, WebP up to 10 MB. Visible to assigned collector & recycler.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                      Pickup Address
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                      Preferred Time Window
                    </label>
                    <input
                      type="text"
                      required
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px] sm:min-h-[52px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-secondary mb-1">
                    Pickup Instructions / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Ring the bell at gate, 2nd floor, etc."
                    className="w-full bg-theme-input border border-theme-border rounded-xl px-4 py-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-theme-primary hover:opacity-95 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-theme-primary/25 flex items-center justify-center space-x-2 min-h-[48px] sm:min-h-[52px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Database & Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Doorstep Pickup Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
