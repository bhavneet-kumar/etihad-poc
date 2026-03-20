import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface UploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

export const Upload: React.FC<UploadProps> = ({ onFilesSelect, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelect(acceptedFiles);
    }
  }, [onFilesSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    disabled: isLoading,
    multiple: true,
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-premium",
        "flex flex-col items-center justify-center gap-4 text-center",
        isDragActive ? "border-primary-gold bg-primary-gold/5" : "border-border hover:border-primary-gold bg-white",
        isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <input {...getInputProps()} />
      
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center transition-premium group-hover:scale-110",
        isDragActive ? "bg-primary-gold text-white" : "bg-light-beige text-primary-gold"
      )}>
        <UploadIcon className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <p className="text-lg font-bold text-dark-brown uppercase tracking-tight">
          {isDragActive ? "Drop the receipt here" : "Upload a receipt"}
        </p>
        <p className="text-sm text-stone-500 max-w-xs">
          Drag and drop your receipt image or PDF here, or click to browse.
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <ImageIcon className="w-4 h-4" />
          <span>JPEG, PNG</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-border border-t-primary-gold rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-dark-brown">Analyzing receipt...</p>
          </div>
        </div>
      )}
    </div>
  );
};
