
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer } from '../components/MapContainer';
import { FileUploader } from '../components/FileUploader';
import { ProvinceData } from '../types/ProvinceData';

const Index = () => {
  const [allData, setAllData] = useState<ProvinceData[]>([]);

  const handleFilesUploaded = (newData: ProvinceData[]) => {
    setAllData(prev => [...prev, ...newData]);
  };

  const handleFileRemoved = (fileName: string) => {
    setAllData(prev => prev.filter(data => data.fileName !== fileName));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Bản đồ tỉnh thành Việt Nam
          </h1>
          <p className="text-gray-600 text-lg">
            Upload file JSON để hiển thị phân bố dân cư theo tỉnh thành
          </p>
        </div>

        <FileUploader 
          onFilesUploaded={handleFilesUploaded}
          onFileRemoved={handleFileRemoved}
          uploadedFiles={allData.map(data => data.fileName)}
        />

        <MapContainer data={allData} />
      </div>
    </div>
  );
};

export default Index;
