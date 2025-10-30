import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { NetworkDiagram } from './NetworkDiagram';

interface Result {
  module: string;
  timestamp: string;
  data: any;
  status: 'success' | 'error' | 'warning' | 'loading';
}

interface ResultDisplayProps {
  results: Result[];
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ results }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'loading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const handleExport = async (result: Result, exportType: 'download' | 'view' = 'download') => {
    // Xử lý khác nhau cho từng module
    if ((result.module === 'personal-search' || result.module === 'info-crawl' || result.module === 'osint-api') && result.status === 'success') {
      try {
        // Parse output để tìm đường dẫn file thực tế
        const stdout = result.data?.stdout || '';
        let filePathMatch;
        
        if (result.module === 'personal-search') {
          // Pattern cho personal-search: "Dữ liệu đã được lưu tại: path"
          filePathMatch = stdout.match(/Dữ liệu đã được lưu tại: (.+\.json)/);
        } else if (result.module === 'info-crawl') {
          // Pattern cho info-crawl: "💾 Đã lưu dữ liệu thành công vào path" (có emoji)
          filePathMatch = stdout.match(/💾 Đã lưu dữ liệu thành công vào\s+(.+\.json)/);
        } else if (result.module === 'osint-api') {
          // Pattern cho các API scripts: "Đã lưu dữ liệu vào path"
          filePathMatch = stdout.match(/Đã lưu dữ liệu vào (.+\.json)/);
        }
        
        if (filePathMatch && filePathMatch[1]) {
          const fullPath = filePathMatch[1].trim();
          console.log('Found full file path:', fullPath);
          console.log('Module:', result.module);
          
          // Đối với osint-api, cần convert absolute path thành relative path
          let relativePath = fullPath;
          if (result.module === 'osint-api' && fullPath.includes('API\\data\\')) {
            // Trích xuất phần từ API\data\ trở đi
            const apiIndex = fullPath.indexOf('API\\data\\');
            if (apiIndex !== -1) {
              relativePath = fullPath.substring(apiIndex);
              console.log('Converted to relative path:', relativePath);
            }
          }
          
          // Kiểm tra file có tồn tại không trước khi download
          const checkUrl = `http://localhost:5000/download-file?path=${encodeURIComponent(relativePath)}`;
          
          try {
            const checkResponse = await fetch(checkUrl, { method: 'HEAD' });
            
            if (!checkResponse.ok) {
              // Nếu file không tồn tại, hiển thị thông báo và fallback
              alert(`File không tồn tại hoặc chưa được tạo.\nModule: ${result.module}\nOriginal: ${fullPath}\nRelative: ${relativePath}\nLỗi: ${checkResponse.status} ${checkResponse.statusText}\n\nSẽ export JSON response thay thế.`);
              console.warn('File not found, falling back to JSON export');
            } else {
              // File tồn tại, tiến hành download
              const link = document.createElement('a');
              link.href = checkUrl;
              link.download = relativePath.split('\\').pop() || relativePath.split('/').pop() || 'crawled_data.json';
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Exit early nếu download thành công
              return;
            }
          } catch (fetchError) {
            console.error('Error checking file:', fetchError);
            alert(`Lỗi khi kiểm tra file: ${fetchError.message}\nSẽ export JSON response thay thế.`);
          }
        } else {
          console.warn('Could not find file path in output for module:', result.module);
          console.log('Full stdout:', stdout);
          alert(`Không tìm thấy đường dẫn file trong output cho module ${result.module}.\nSẽ export JSON response thay thế.`);
        }
      } catch (error) {
        console.error('Error in export logic:', error);
        alert(`Lỗi khi xử lý export: ${error.message}\nSẽ export JSON response thay thế.`);
      }
    }
    
    // Xử lý riêng cho migration-check
    if (result.module === 'migration-check' && result.status === 'success' && result.data?.generated_file) {
      if (exportType === 'download') {
        // Chỉ download file JSON trực tiếp, không popup, không mở tab
        try {
          const checkUrl = `http://localhost:5000/download-file?path=${encodeURIComponent(`CrawCheckin/src/data/${result.data.generated_file}`)}`;
          const checkResponse = await fetch(checkUrl, { method: 'HEAD' });
          
          if (checkResponse.ok) {
            // Download file trực tiếp
            const link = document.createElement('a');
            link.href = checkUrl;
            link.download = result.data.generated_file;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
        } catch (error) {
          console.error('Error downloading file:', error);
        }
        
        // Fallback: export JSON result
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `migration-check-result-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      } else if (exportType === 'view') {
        // Export với popup và mở tab mới
        try {
          // Auto-export qua /move-history endpoint và mở checkin_routes.html
          const response = await fetch('http://localhost:5000/move-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_name: result.data.generated_file })
          });
          
          const exportData = await response.json();
          
          if (!exportData.error) {
            // Mở checkin_routes.html trong tab mới
            setTimeout(() => {
              const checkinUrl = '/hyvongcuoicung/new2/checkin_routes.html';
              window.open(checkinUrl, '_blank');
            }, 1000);
            
            alert(`✅ Đã export thành công file: ${result.data.generated_file}\nData đã được ghi vào data_checkin.js và mở checkin_routes.html`);
            return;
          } else {
            alert(`❌ Lỗi khi export: ${exportData.error}`);
          }
        } catch (error) {
          console.error('Error exporting migration-check:', error);
          alert(`❌ Lỗi khi export: ${error.message}`);
        }
      }
    }
    
    // Logic export JSON mặc định cho các module khác hoặc fallback
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `osint-result-${result.module}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-16 h-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400 text-center">
            Execute an OSINT module to see results here. All investigation data will be displayed and can be exported.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Investigation Results</h2>
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {results.length} Results
        </Badge>
      </div>
      
      <ScrollArea className="h-[600px] space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="bg-black/20 border-white/10 backdrop-blur-sm mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <CardTitle className="text-white text-lg">
                      {result.module.replace('-', ' ').toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-gray-400 flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(result.timestamp)}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport(result)}
                    className="border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                {result.status === 'loading' ? (
                  <div className="flex flex-col space-y-3 text-blue-400">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang chạy, vui lòng chờ...</span>
                    </div>
                    {result.module === 'info-crawl' && (
                      <div className="text-sm text-gray-400 italic">
                        ⏱️ Thời gian phụ thuộc vào số lượng người (~2-3 phút/người).<br/>
                        🔄 Hệ thống đang truy cập và thu thập dữ liệu từ Facebook.<br/>
                        📊 Quá trình sẽ chạy cho đến khi hoàn thành.<br/>
                        💡 <strong>Tip:</strong> Theo dõi log trong terminal để biết tiến độ chi tiết.
                      </div>
                    )}
                    {result.module === 'personal-search' && (
                      <div className="text-sm text-gray-400 italic">
                        ⏱️ Crawl danh sách bạn bè có thể mất 1-3 phút.<br/>
                        🔄 Hệ thống đang truy cập Facebook để lấy dữ liệu.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.module === 'info-crawl' && result.data?.total_profiles && (
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded p-3 mb-3">
                        <div className="text-blue-300 text-sm">
                          📊 <strong>Thông tin crawl:</strong><br/>
                          👥 Tổng số profile: {result.data.total_profiles}<br/>
                          ⏱️ Thời gian ước tính: ~{result.data.estimated_time_minutes?.toFixed(1)} phút<br/>
                          📁 Thư mục: {result.data.friends_dir}
                        </div>
                      </div>
                    )}
                    {result.module === 'network-scan' && result.data?.data_js_created && (
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded p-3 mb-3">
                        <div className="text-orange-300 text-sm">
                          🌐 <strong>Sơ đồ mạng đã tạo:</strong><br/>
                          📁 Đã tạo file: data.js<br/>
                          🔗 HTML file: {result.data.network_html_path}<br/>
                          💡 <strong>Cách xem:</strong> Mở file network.html trong browser
                        </div>
                      </div>
                    )}
                    {result.module === 'network-scan' && result.data?.tree_data && (
                      <div className="mb-4">
                        <NetworkDiagram data={result.data} width={750} height={500} />
                      </div>
                    )}
                    {result.module === 'migration-check' && result.data?.generated_file && (
                      <div className="bg-teal-900/30 border border-teal-500/30 rounded p-3 mb-3">
                        <div className="text-teal-300 text-sm mb-3">
                          📊 <strong>Check-in data đã crawl xong:</strong><br/>
                          📁 File đã tạo: <span className="font-mono bg-black/30 px-1 rounded">{result.data.generated_file}</span><br/>
                          💡 <strong>Hành động tiếp theo:</strong> Nhấn "Export & View" để xem biểu đồ di chuyển
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExport(result, 'view')}
                          className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export & View Routes
                        </Button>
                      </div>
                    )}
                    <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
};
