import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, Globe, Users, Network, Database, CheckCircle, Activity } from 'lucide-react';
import { ToolModule } from '@/components/ToolModule';
import { ResultDisplay } from '@/components/ResultDisplay';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const osintModules = [
    {
      id: 'personal-search',
      title: 'Crawl danh sách bạn bè',
      description: 'Thu thập thông tin danh sách bạn bè từ Facebook theo uid/username',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      category: 'social'
    },
    {
      id: 'info-crawl',
      title: 'Crawl thông tin cá nhân',
      description: 'Crawl thông tin cá nhân từ file dữ liệu bạn bè đã thu thập',
      icon: Search,
      color: 'from-purple-500 to-pink-500',
      category: 'personal'
    },
    {
      id: 'osint-api',
      title: 'OSINT bằng API',
      description: 'Sử dụng các API scripts có sẵn để thu thập intelligence',
      icon: Database,
      color: 'from-green-500 to-emerald-500',
      category: 'api'
    },
    {
      id: 'network-scan',
      title: 'Sinh sơ đồ mạng',
      description: 'Tạo sơ đồ network topology từ dữ liệu bạn bè (network.html)',
      icon: Network,
      color: 'from-orange-500 to-red-500',
      category: 'network'
    },
    {
      id: 'success-stats',
      title: 'Thống kê tỉnh thành',
      description: 'Phân tích dữ liệu địa lý từ file thông tin cá nhân đã crawl',
      icon: Globe,
      color: 'from-indigo-500 to-purple-500',
      category: 'geo'
    },
    {
      id: 'migration-check',
      title: 'Lấy thông tin di chuyển',
      description: 'Crawler thông tin check-in và lịch trình di chuyển theo uid/username',
      icon: Activity,
      color: 'from-teal-500 to-cyan-500',
      category: 'tracking'
    },
    {
      id: 'history-check',
      title: 'Thống kê lịch trình di chuyển',
      description: 'Phân tích và visualize từ file check-in đã thu thập (checkin_routes.html)',
      icon: CheckCircle,
      color: 'from-pink-500 to-rose-500',
      category: 'analytics'
    },
    {
      id: 'exit',
      title: 'Thoát',
      description: 'Kết thúc phiên làm việc và thoát tool',
      icon: Shield,
      color: 'from-gray-500 to-slate-500',
      category: 'system'
    }
  ];

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    setResults([]);
    
    console.log(`Selected module: ${moduleId}`);
  };

  const handleRunModule = async (moduleId: string, inputData: any): Promise<void> => {
    setIsLoading(true);
    const now = new Date().toISOString();

    // Thêm kết quả tạm thời (loading)
    setResults(prev => [{
      module: moduleId,
      timestamp: now,
      data: 'Đang chạy, vui lòng chờ...',
      status: 'loading'
    }, ...prev]);

    try {
      let response, data;
      const input = inputData.input;
      if (moduleId === 'personal-search') {
        response = await fetch('http://localhost:5000/crawl-friend-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: input.username,
            layers: input.layers,
            friends_per_layer: input.friends_per_layer,
            confirm: input.confirm
          })
        });
        data = await response.json();
      } else if (moduleId === 'info-crawl') {
        // Không giới hạn thời gian, để chạy cho đến khi hoàn thành
        // Thời gian phụ thuộc vào số lượng người cần crawl
        response = await fetch('http://localhost:5000/crawl-profile-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friends_dir: input })
        });
        data = await response.json();
      } else if (moduleId === 'osint-api') {
        // Validation để đảm bảo có script được chọn
        if (!input.script) {
          throw new Error('Vui lòng chọn script API');
        }
        
        response = await fetch('http://localhost:5000/osint-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: input.script,
            params: input.params || {}
          })
        });
        data = await response.json();
      } else if (moduleId === 'network-scan') {
        let [dir_name, file_name] = input.split(',').map((s: string) => s.trim());
        response = await fetch('http://localhost:5000/network-diagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dir_name, file_name })
        });
        data = await response.json();
        
        // Nếu thành công, tự động mở network.html trong tab mới
        if (!data.error) {
          setTimeout(() => {
            const networkUrl = '/hyvongcuoicung/new2/network.html';
            window.open(networkUrl, '_blank');
          }, 2000); // Delay 2 giây để đảm bảo backend đã xử lý và copy file xong
        }
      } else if (moduleId === 'success-stats') {
        response = await fetch('http://localhost:5000/province-stats');
        data = await response.json();
        
        // Nếu thành công, tự động mở map/index.html trong tab mới
        if (!data.error) {
          setTimeout(() => {
            const mapUrl = '/hyvongcuoicung/new2/map/index.html';
            window.open(mapUrl, '_blank');
          }, 2000); // Delay 2 giây để đảm bảo backend đã xử lý và copy file xong
        }
      } else if (moduleId === 'migration-check') {
        response = await fetch('http://localhost:5000/move-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: input.username,
            posts_count: input.posts_count,
            year: input.year,
            month: input.month,
            day: input.day
          })
        });
        data = await response.json();
      } else if (moduleId === 'history-check') {
        response = await fetch('http://localhost:5000/move-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: input })
        });
        data = await response.json();
        
        // Nếu thành công, tự động mở checkin_routes.html trong tab mới
        if (!data.error) {
          setTimeout(() => {
            const checkinUrl = '/hyvongcuoicung/new2/checkin_routes.html';
            window.open(checkinUrl, '_blank');
          }, 2000); // Delay 2 giây để đảm bảo backend đã xử lý và copy file xong
        }
      } else if (moduleId === 'exit') {
        data = { message: 'Session ended. You can close the browser.' };
        
        // Tự động đóng tab sau 1.5 giây
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        data = { error: 'Unknown module' };
      }
      // Cập nhật lại kết quả đầu tiên (vừa thêm) thành kết quả thực tế
      setResults(prev => [
        {
          module: moduleId,
          timestamp: now,
          data: data,
          status: data.error ? 'error' : 'success'
        },
        ...prev.slice(1)
      ]);
    } catch (error: any) {
      setResults(prev => [
        {
          module: moduleId,
          timestamp: now,
          data: error.message || 'Unknown error',
          status: 'error'
        },
        ...prev.slice(1)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle opening province statistics map in new tab
  const handleThongKeTinhThanh = () => {
    // Open the original HTML file directly
    const url = '/hyvongcuoicung/new2/map/index.html';
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                OSINT Tool Suite
              </h1>
              <p className="text-blue-200 text-lg">
                Professional Open Source Intelligence Platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Online
              </Badge>
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10">
            <TabsTrigger value="modules" className="data-[state=active]:bg-blue-600">
              Modules
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-blue-600">
              Results ({results.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {osintModules.map((module) => (
                <ToolModule
                  key={module.id}
                  module={module}
                  isActive={activeModule === module.id}
                  onSelect={handleModuleSelect}
                  onRun={handleRunModule}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultDisplay results={results} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Configuration</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure your OSINT tool settings and API keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">API Endpoint</label>
                  <Input 
                    placeholder="http://localhost:5000" 
                    defaultValue="http://localhost:5000"
                    className="bg-black/30 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Timeout (seconds)</label>
                  <Input 
                    type="number" 
                    placeholder="30" 
                    defaultValue="300"
                    className="bg-black/30 border-white/20 text-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:5000/test');
                        const data = await response.json();
                        alert(`✓ Backend connected successfully!\nMessage: ${data.message}`);
                      } catch (error) {
                        alert(`✗ Backend connection failed!\nError: ${error.message}\n\nMake sure backend is running on port 5000`);
                      }
                    }}
                  >
                    Test Backend Connection
                  </Button>
                  <Button className="bg-gray-600 hover:bg-gray-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
