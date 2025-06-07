import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LucideIcon, Play, Loader2 } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
}

interface ToolModuleProps {
  module: Module;
  isActive: boolean;
  onSelect: (moduleId: string) => void;
  onRun: (moduleId: string, inputData: any) => Promise<void>;
  isLoading: boolean;
}

export const ToolModule: React.FC<ToolModuleProps> = ({
  module,
  isActive,
  onSelect,
  onRun,
  isLoading
}) => {
  const [input, setInput] = useState<any>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [apiScripts, setApiScripts] = useState<string[]>([]);
  const [friendsDirs, setFriendsDirs] = useState<string[]>([]);
  const [friendsFiles, setFriendsFiles] = useState<string[]>([]);
  const [selectedDir, setSelectedDir] = useState('');
  const [checkinFiles, setCheckinFiles] = useState<string[]>([]);

  useEffect(() => {
    if (isDialogOpen) {
      if (module.id === 'osint-api') {
        fetch('http://localhost:5000/list-api-scripts')
          .then(res => res.json())
          .then(data => setApiScripts(data.scripts || []));
      } else if (module.id === 'network-scan') {
        fetch('http://localhost:5000/list-friends-data')
          .then(res => res.json())
          .then(data => {
            setFriendsDirs(Object.keys(data.data || {}));
            setSelectedDir('');
            setFriendsFiles([]);
          });
      } else if (module.id === 'info-crawl') {
        fetch('http://localhost:5000/list-friends-data')
          .then(res => res.json())
          .then(data => {
            setFriendsDirs(Object.keys(data.data || {}));
            setSelectedDir('');
          });
      } else if (module.id === 'history-check') {
        fetch('http://localhost:5000/list-checkin-files')
          .then(res => res.json())
          .then(data => setCheckinFiles(data.files || []));
      }
    }
  }, [isDialogOpen, module.id]);

  useEffect(() => {
    if (module.id === 'network-scan' && selectedDir) {
      fetch('http://localhost:5000/list-friends-data')
        .then(res => res.json())
        .then(data => setFriendsFiles((data.data && data.data[selectedDir]) || []));
    }
  }, [selectedDir, module.id]);

  const handleRun = async () => {
    if (module.id === 'exit') {
      setIsDialogOpen(false);
      setTimeout(() => {
        window.close();
      }, 500);
      return;
    }

    let realInput: any = input;
    if (module.id === 'osint-api') {
      realInput = {
        script: input.script || (apiScripts.length > 0 ? apiScripts[0] : ''),
        params: input.params || {}
      };
    } else if (module.id === 'network-scan') {
      realInput = selectedDir && input.input ? `${selectedDir},${input.input}` : '';
    } else if (module.id === 'info-crawl') {
      realInput = input.input || (friendsDirs.length > 0 ? friendsDirs[0] : '');
    } else if (module.id === 'history-check') {
      realInput = input.input || (checkinFiles.length > 0 ? checkinFiles[0] : '');
    } else if (module.id === 'migration-check') {
      realInput = {
        username: input.username,
        posts_count: input.posts_count || '',
        year: input.year || '',
        month: input.month || '',
        day: input.day || ''
      };
    }
    await onRun(module.id, { input: realInput });
    setIsDialogOpen(false);
    setInput({});
    setSelectedDir('');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      social: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      personal: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      api: 'bg-green-500/20 text-green-400 border-green-500/30',
      network: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      geo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      tracking: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      analytics: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      system: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  const Icon = module.icon;

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:scale-105 bg-black/20 border-white/10 backdrop-blur-sm hover:border-white/30 ${
        isActive ? 'ring-2 ring-blue-500 border-blue-500/50' : ''
      }`}
      onClick={() => onSelect(module.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} group-hover:shadow-lg transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <Badge variant="outline" className={getCategoryColor(module.category)}>
            {module.category}
          </Badge>
        </div>
        <CardTitle className="text-white text-lg group-hover:text-blue-300 transition-colors">
          {module.title}
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm leading-relaxed">
          {module.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              disabled={isLoading}
              onClick={e => e.stopPropagation()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : module.id === 'exit' ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Exit tool
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Icon className="w-5 h-5" />
                <span>{module.title}</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {module.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {module.id === 'personal-search' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Nhập UID hoặc username</label>
                    <Input
                      placeholder="VD: 1000xxxx, username..."
                      value={input.username || ''}
                      onChange={e => setInput({ ...input, username: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Số tầng cần crawl</label>
                    <Input
                      placeholder="VD: 0"
                      value={input.layers || ''}
                      onChange={e => setInput({ ...input, layers: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Số bạn bè mỗi tầng (cách nhau dấu phẩy)</label>
                    <Input
                      placeholder="VD: 1,2,3"
                      value={input.friends_per_layer || ''}
                      onChange={e => setInput({ ...input, friends_per_layer: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Xác nhận tiếp tục</label>
                    <Input
                      placeholder="y"
                      value={input.confirm || 'y'}
                      onChange={e => setInput({ ...input, confirm: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                </>
              )}
              {module.id === 'osint-api' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Chọn script API</label>
                    <select
                      className="w-full bg-black/30 border-white/20 text-white p-2 rounded"
                      value={input.script || ''}
                      onChange={e => setInput({ ...input, script: e.target.value, params: {} })}
                    >
                      <option value="">-- Chọn script --</option>
                      {apiScripts.map(script => (
                        <option key={script} value={script}>{script}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Dynamic parameters cho từng script */}
                  {input.script === 'getcmt.py' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Post ID (pfbid...)</label>
                      <Input
                        placeholder="VD: pfbid02HXLE9XfxtxdVnj9mg25WpUmtR3Kc1rgFNVuvM39rtafB3nZvgySgPkgF6qcTXvLGl"
                        value={input.params?.post_id || ''}
                        onChange={e => setInput({ ...input, params: { ...input.params, post_id: e.target.value } })}
                        className="bg-black/30 border-white/20 text-white"
                      />
                      <div className="text-xs text-gray-400 italic">
                        Nhập Post ID để lấy danh sách comment
                      </div>
                    </div>
                  )}
                  
                  {input.script === 'nested_cmt.py' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Post ID (số)</label>
                        <Input
                          placeholder="VD: 735148542323887"
                          value={input.params?.post_id || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, post_id: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Comment ID (số)</label>
                        <Input
                          placeholder="VD: 1366560114455418"
                          value={input.params?.comment_id || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, comment_id: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Expansion Token</label>
                        <Textarea
                          placeholder="Lấy từ response của getcmt.py..."
                          value={input.params?.expansion_token || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, expansion_token: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white h-20"
                        />
                      </div>
                    </>
                  )}
                  
                  {input.script === 'post_details.py' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Post ID (pfbid...) hoặc URL</label>
                      <Input
                        placeholder="VD: pfbid084g6tqcXEFBCR4Giao3u5JjaDy4HvqzP8PW5JrxRQ8UZiJJenLsEq14U3EWT4VJbl"
                        value={input.params?.post_id || ''}
                        onChange={e => setInput({ ...input, params: { ...input.params, post_id: e.target.value } })}
                        className="bg-black/30 border-white/20 text-white"
                      />
                      <div className="text-xs text-gray-400 italic">
                        Nhập Post ID hoặc URL để lấy thông tin chi tiết bài viết
                      </div>
                    </div>
                  )}
                  
                  {input.script === 'pro5_detail.py' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Username hoặc UID</label>
                      <Input
                        placeholder="VD: sonnopro123 hoặc 100012158418273"
                        value={input.params?.username || ''}
                        onChange={e => setInput({ ...input, params: { ...input.params, username: e.target.value } })}
                        className="bg-black/30 border-white/20 text-white"
                      />
                      <div className="text-xs text-gray-400 italic">
                        Nhập username hoặc UID để lấy thông tin profile
                      </div>
                    </div>
                  )}
                  
                  {input.script === 'post_data.py' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Profile/Page ID</label>
                        <Input
                          placeholder="VD: 61575782378737"
                          value={input.params?.profile_id || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, profile_id: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white"
                        />
                        <div className="text-xs text-gray-400 italic">
                          Nhập Profile ID hoặc Page ID để lấy danh sách bài viết
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Ngày bắt đầu (mm/dd/yyyy)</label>
                        <Input
                          placeholder="VD: 01/15/2023 (để trống nếu không cần)"
                          value={input.params?.start_date || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, start_date: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Ngày kết thúc (mm/dd/yyyy)</label>
                        <Input
                          placeholder="VD: 12/31/2023 (để trống nếu không cần)"
                          value={input.params?.end_date || ''}
                          onChange={e => setInput({ ...input, params: { ...input.params, end_date: e.target.value } })}
                          className="bg-black/30 border-white/20 text-white"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              {module.id === 'info-crawl' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Chọn thư mục dữ liệu bạn bè</label>
                  <select
                    className="w-full bg-black/30 border-white/20 text-white p-2 rounded"
                    value={input.input || ''}
                    onChange={e => setInput({ ...input, input: e.target.value })}
                  >
                    <option value="">-- Chọn thư mục friends_data --</option>
                    {friendsDirs.map(dir => (
                      <option key={dir} value={dir}>{dir}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-400 italic">
                    Chọn thư mục chứa dữ liệu bạn bè đã crawl từ module "Crawl danh sách bạn bè"<br/>
                    ⏱️ <strong>Thời gian ước tính:</strong> ~2-3 phút/người (phụ thuộc vào số lượng profile)<br/>
                    📊 Quá trình sẽ chạy cho đến khi hoàn thành, không bị giới hạn thời gian
                  </div>
                </div>
              )}
              {module.id === 'network-scan' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Chọn thư mục dữ liệu</label>
                    <select
                      className="w-full bg-black/30 border-white/20 text-white p-2 rounded"
                      value={selectedDir}
                      onChange={e => {
                        setSelectedDir(e.target.value);
                        setInput({ ...input, input: '' });
                      }}
                    >
                      <option value="">-- Chọn thư mục --</option>
                      {friendsDirs.map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                      ))}
                    </select>
                  </div>
                  {selectedDir && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Chọn file JSON</label>
                      <select
                        className="w-full bg-black/30 border-white/20 text-white p-2 rounded"
                        value={input.input || ''}
                        onChange={e => setInput({ ...input, input: e.target.value })}
                      >
                        <option value="">-- Chọn file --</option>
                        {friendsFiles.map(file => (
                          <option key={file} value={file}>{file}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              {module.id === 'history-check' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Chọn file dữ liệu check-in</label>
                  <select
                    className="w-full bg-black/30 border-white/20 text-white p-2 rounded"
                    value={input.input || ''}
                    onChange={e => setInput({ ...input, input: e.target.value })}
                  >
                    <option value="">-- Chọn file --</option>
                    {checkinFiles.map(file => (
                      <option key={file} value={file}>{file}</option>
                    ))}
                  </select>
                </div>
              )}
              {module.id === 'migration-check' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Username/UID (bắt buộc)</label>
                    <Input
                      placeholder="VD: phuc.duy.980944"
                      value={input.username || ''}
                      onChange={e => setInput({ ...input, username: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Số bài muốn tìm check-in</label>
                    <Input
                      placeholder="VD: 5 (để trống để crawl tất cả)"
                      value={input.posts_count || ''}
                      onChange={e => setInput({ ...input, posts_count: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Khoảng năm</label>
                    <Input
                      placeholder="VD: 2025 (để trống để crawl tất cả năm)"
                      value={input.year || ''}
                      onChange={e => setInput({ ...input, year: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Khoảng tháng</label>
                    <Input
                      placeholder="VD: 6 (để trống để crawl tất cả tháng)"
                      value={input.month || ''}
                      onChange={e => setInput({ ...input, month: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Khoảng ngày</label>
                    <Input
                      placeholder="VD: 15 (để trống để crawl tất cả ngày)"
                      value={input.day || ''}
                      onChange={e => setInput({ ...input, day: e.target.value })}
                      className="bg-black/30 border-white/20 text-white"
                    />
                  </div>
                  <div className="text-xs text-gray-400 italic">
                    ⚠️ <strong>Lưu ý:</strong> Quá trình crawl check-in có thể mất thời gian dài<br/>
                    📊 Kết quả sẽ được lưu vào file JSON với timestamp<br/>
                    🔍 Username/UID là bắt buộc, các field khác có thể để trống
                  </div>
                </>
              )}
              {module.id === 'success-stats' && (
                <div className="text-gray-400 italic">Không cần nhập dữ liệu đầu vào.</div>
              )}
              {module.id === 'exit' && (
                <div className="h-16"></div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRun}
                disabled={
                  (module.id === 'personal-search' && (!input.username || !input.layers || !input.friends_per_layer)) ||
                  (module.id === 'osint-api' && (!input.script || 
                    (input.script === 'getcmt.py' && !input.params?.post_id) ||
                    (input.script === 'nested_cmt.py' && (!input.params?.post_id || !input.params?.comment_id || !input.params?.expansion_token)) ||
                    (input.script === 'post_details.py' && !input.params?.post_id) ||
                    (input.script === 'pro5_detail.py' && !input.params?.username) ||
                    (input.script === 'post_data.py' && !input.params?.profile_id)
                  )) ||
                  (module.id === 'info-crawl' && !input.input) ||
                  (module.id === 'network-scan' && (!selectedDir || !input.input)) ||
                  (module.id === 'history-check' && !input.input) ||
                  (module.id === 'migration-check' && !input.username) ||
                  isLoading
                }
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : module.id === 'exit' ? (
                  'Đồng ý'
                ) : (
                  'Run Module'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
