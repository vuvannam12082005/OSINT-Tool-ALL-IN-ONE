
import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProvinceData } from '../types/ProvinceData';

interface FileUploaderProps {
  onFilesUploaded: (data: ProvinceData[]) => void;
  onFileRemoved: (fileName: string) => void;
  uploadedFiles: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  onFileRemoved,
  uploadedFiles
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readJSONFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files: FileList) => {
    const newData: ProvinceData[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (uploadedFiles.includes(file.name)) {
        toast.error(`File ${file.name} đã được upload trước đó`);
        continue;
      }

      if (!file.name.endsWith('.json')) {
        toast.error(`File ${file.name} không phải là file JSON`);
        continue;
      }

      try {
        const jsonData = await readJSONFile(file);
        newData.push({
          fileName: file.name,
          jsonData: jsonData
        });
        toast.success(`Đã upload thành công file ${file.name}`);
      } catch (error) {
        toast.error(`Lỗi khi đọc file ${file.name}: ${error}`);
      }
    }

    if (newData.length > 0) {
      onFilesUploaded(newData);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Kéo thả file JSON hoặc click để chọn
          </h3>
          <p className="text-gray-500 mb-4">
            Chỉ chấp nhận file .json chứa dữ liệu quê quán
          </p>
          <Button variant="outline" className="pointer-events-none">
            <Upload className="mr-2 h-4 w-4" />
            Chọn files JSON
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              Files đã upload ({uploadedFiles.length})
            </h4>
            <div className="grid gap-2">
              {uploadedFiles.map((fileName) => (
                <div
                  key={fileName}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-700">{fileName}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onFileRemoved(fileName);
                      toast.success(`Đã xóa file ${fileName}`);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
