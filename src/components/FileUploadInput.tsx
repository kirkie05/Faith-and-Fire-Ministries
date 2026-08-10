import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

export interface FileUploadInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  id?: string;
  maxSizeMB?: number;
  storagePath?: string;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({ 
  label, 
  value, 
  onChange, 
  accept = "image/*", 
  id, 
  maxSizeMB = 10,
  storagePath = "public/uploads"
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setErrorMsg(`File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${maxSizeMB}MB limit. Please upload a compressed file.`);
      return;
    }

    const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const fileRef = ref(storage, `${storagePath}/${uniqueFileName}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    setUploadProgress(0);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setErrorMsg("Upload failed. Please try again.");
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
        } catch (err) {
          console.error("Failed to get download URL:", err);
          setErrorMsg("Failed to retrieve file URL.");
        } finally {
          setUploadProgress(null);
        }
      }
    );
  };

  return (
    <div className="space-y-1" id={id}>
      <label className="block text-neutral-700 font-bold uppercase text-[10px] sm:text-xs mb-1">{label}</label>
      <div className="flex gap-3 items-center">
        {value && !value.startsWith("data:") && (
          <div className="w-14 h-14 rounded border border-neutral-200 overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center shadow-xs">
            {accept && accept.includes("video") && (value.startsWith("data:video") || value.includes(".mp4")) ? (
              <video src={value} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
        )}
        {value && value.startsWith("data:") && (
          <div className="w-14 h-14 rounded border border-orange-300 overflow-hidden shrink-0 bg-orange-50 flex items-center justify-center shadow-xs relative group">
            <img src={value} alt="Legacy Base64 Preview" className="w-full h-full object-cover opacity-50 grayscale" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-orange-800 text-center uppercase">Legacy<br/>Format</span>
          </div>
        )}
        <div className="flex-1 relative">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploadProgress !== null}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`border p-3 rounded-lg focus:outline-none text-center text-xs transition-colors font-bold overflow-hidden relative ${
            uploadProgress !== null 
              ? "border-amber-400 bg-amber-50 text-amber-800" 
              : "border-neutral-300 bg-white text-[#1e1548] hover:bg-neutral-50 border-dashed border-2"
          }`}>
            {uploadProgress !== null 
              ? `Uploading... ${Math.round(uploadProgress)}%` 
              : value ? "✓ Change File (Upload)" : "＋ Choose File (Upload)"}
            
            {uploadProgress !== null && (
              <div className="absolute bottom-0 left-0 h-1 bg-amber-400 rounded-r transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            )}
          </div>
        </div>
      </div>
      {errorMsg && (
        <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-1">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
};
