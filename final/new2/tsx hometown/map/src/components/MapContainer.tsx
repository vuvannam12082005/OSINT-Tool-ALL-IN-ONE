
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProvinceData } from '../types/ProvinceData';
import { VietnamMap } from './VietnamMap';

interface MapContainerProps {
  data: ProvinceData[];
}

export const MapContainer: React.FC<MapContainerProps> = ({ data }) => {
  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-800">
          Phân bố theo tỉnh thành
        </CardTitle>
        <p className="text-gray-600">
          {data.length > 0 
            ? `Hiển thị dữ liệu từ ${data.length} file(s)` 
            : 'Chưa có dữ liệu để hiển thị'
          }
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <VietnamMap data={data} />
      </CardContent>
    </Card>
  );
};
