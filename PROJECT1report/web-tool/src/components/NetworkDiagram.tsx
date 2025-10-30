import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, User, Users, ZoomIn, ZoomOut, Maximize, Play, Pause, X, Minimize } from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  level: number;
  children?: NetworkNode[];
}

interface NetworkDiagramProps {
  data: any;
  width?: number;
  height?: number;
}

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ 
  data, 
  width = 800, 
  height = 600 
}) => {
  const networkRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [network, setNetwork] = useState<any>(null);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [hierarchicalMode, setHierarchicalMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewDragging, setIsViewDragging] = useState(false);

  // Debug log để kiểm tra dữ liệu nhận được
  console.log('🔍 NetworkDiagram received data:', data);
  console.log('🔍 Data has tree_data:', !!data?.tree_data);
  console.log('🔍 Root user:', data?.root_user);
  
  // Thêm debug chi tiết cho data structure
  if (data) {
    console.log('🔍 Data keys:', Object.keys(data));
    console.log('🔍 Data stringify (first 500 chars):', JSON.stringify(data).substring(0, 500));
    if (data.tree_data) {
      console.log('🔍 tree_data keys:', Object.keys(data.tree_data));
      console.log('🔍 tree_data id:', data.tree_data.id);
      console.log('🔍 tree_data children count:', data.tree_data.children?.length || 0);
      console.log('🔍 tree_data full structure:', JSON.stringify(data.tree_data, null, 2));
    }
  }

  // Fallback test data để debug
  const testData = {
    "root_user": "phuc.duy.980944",
    "max_layers": 1,
    "crawled_at": "2025-06-02 22:32:18",
    "total_accounts": 2,
    "tree_data": {
      "id": "phuc.duy.980944",
      "profile_url": "https://www.facebook.com/phuc.duy.980944",
      "layer": 0,
      "children": [
        {
          "id": "trung.buiquoc.3154",
          "username": "trung.buiquoc.3154",
          "profile_url": "https://www.facebook.com/trung.buiquoc.3154",
          "layer": 1,
          "title": "Bùi Quốc Trung",
          "children": [
            {
              "id": "truong.nguyen.207923",
              "username": "truong.nguyen.207923",
              "profile_url": "https://www.facebook.com/truong.nguyen.207923",
              "layer": 2,
              "title": "Trường Nguyễn",
              "children": []
            }
          ]
        }
      ]
    }
  };

  // Sử dụng test data nếu không có data hoặc tree_data
  const finalData = (data && data.tree_data) ? data : testData;
  console.log('🎯 Using final data:', finalData === testData ? 'TEST DATA' : 'API DATA');

  useEffect(() => {
    if (!finalData || !finalData.tree_data || !networkRef.current) {
      console.error('❌ Missing finalData or tree_data or networkRef');
      return;
    }

    // Thêm CSS cho tooltip giống file HTML
    const styleId = 'network-diagram-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .node-tooltip {
          padding: 10px;
          background-color: #ffffff;
          border-radius: 4px;
          border: 1px solid #d3d3d3;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
          max-width: 300px;
          pointer-events: auto;
          z-index: 10000;
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .node-tooltip-header {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eaeaea;
          color: #333;
        }
        
        .node-tooltip-row {
          margin-bottom: 4px;
          color: #333;
        }
        
        .node-tooltip-label {
          font-weight: bold;
          display: inline-block;
          margin-right: 5px;
          color: #333;
        }
        
        .node-tooltip a {
          color: #3498db !important;
          text-decoration: none;
          cursor: pointer;
        }
        
        .node-tooltip a:hover {
          color: #2980b9 !important;
          text-decoration: underline;
        }
      `;
      document.head.appendChild(style);
    }

    const loadVisJS = async () => {
      if (!(window as any).vis) {
        console.log("🔄 Loading vis-network...");
        const script = document.createElement('script');
        script.src = 'https://visjs.github.io/vis-network/standalone/umd/vis-network.min.js';
        script.onload = () => {
          console.log("✅ Vis-network loaded successfully");
          initializeNetwork();
        };
        script.onerror = () => {
          console.error("❌ Failed to load vis-network");
        };
        document.head.appendChild(script);
      } else {
        console.log("✅ Vis-network already loaded");
        initializeNetwork();
      }
    };

    const initializeNetwork = () => {
      const vis = (window as any).vis;
      if (!vis) return;

      // Chuẩn hóa dữ liệu - xử lý nhiều trường hợp
      let treeData = finalData.tree_data;
      
      console.log('🔧 Raw tree_data:', treeData);
      
      // Nếu tree_data là array, lấy phần tử đầu tiên
      if (Array.isArray(treeData)) {
        console.log('🔧 tree_data is array, taking first element');
        treeData = treeData[0];
      }
      
      // Nếu vẫn không có id, thử tìm trong keys khác
      if (!treeData?.id) {
        console.log('🔧 No ID found, checking alternative structures...');
        console.log('🔧 Available keys:', Object.keys(treeData || {}));
        
        // Có thể dữ liệu nằm trong key khác
        for (const key of Object.keys(treeData || {})) {
          if (typeof treeData[key] === 'object' && treeData[key]?.id) {
            console.log(`🔧 Found potential tree in key: ${key}`);
            treeData = treeData[key];
            break;
          }
        }
      }

      console.log('🔧 Final processed tree_data:', treeData);

      // Sử dụng hàm extractNodesAndEdges giống hệt file HTML
      const { nodes, edges, tooltips } = extractNodesAndEdges(treeData);
      
      console.log('🎯 Extracted nodes:', nodes.length);
      console.log('🎯 Extracted edges:', edges.length);
      
      if (nodes.length === 0) {
        console.error('❌ No nodes extracted from tree data!');
        console.error('❌ Tree data structure:', JSON.stringify(treeData, null, 2));
        return;
      }
      
      const visData = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
      };

      const options = {
        nodes: {
          font: { 
            size: 14,
            face: 'Arial',
            color: '#333333'
          },
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.5)',
            size: 10,
            x: 5,
            y: 5
          },
          chosen: false
        },
        edges: {
          width: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.5)',
            size: 10,
            x: 5,
            y: 5
          },
          smooth: {
            enabled: true,
            type: 'dynamic',
            roundness: 0.5
          },
          chosen: false
        },
        interaction: {
          hover: true,
          hideEdgesOnDrag: false,
          multiselect: true,
          tooltipDelay: 200,
          hideNodesOnDrag: false
        },
        physics: {
          enabled: physicsEnabled,
          forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18,
            damping: 0.4,
            avoidOverlap: 0.5
          },
          maxVelocity: 146,
          minVelocity: 0.75,
          solver: 'forceAtlas2Based',
          stabilization: {
            enabled: true,
            iterations: 2000,
            updateInterval: 25
          },
          timestep: 0.35,
          adaptiveTimestep: true
        },
        layout: {
          improvedLayout: true,
          hierarchical: {
            enabled: hierarchicalMode,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 200,
            levelSeparation: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true
          }
        }
      };

      const networkInstance = new vis.Network(networkRef.current, visData, options);
      setNetwork(networkInstance);

      // Bật animation support
      networkInstance.setOptions({
        configure: {
          enabled: false
        },
        interaction: {
          hover: true,
          hideEdgesOnDrag: false,
          multiselect: true,
          selectConnectedEdges: false
        }
      });

      // Setup events với tooltips
      setupNetworkEvents(networkInstance, tooltips, visData);

      // Đảm bảo network stabilize trước khi cho phép interactions - giống HTML gốc
      networkInstance.once("stabilizationIterationsDone", function() {
        console.log("🎯 Network stabilized - animations ready");
        // Fit với animation sau khi stabilize
        setTimeout(() => {
          networkInstance.fit({
            animation: {
              duration: 1000,
              easingFunction: "easeInOutQuad"
            }
          });
        }, 500);
      });

      // Đảm bảo fit hoạt động mượt mà sau khi stabilize
      networkInstance.once("afterDrawing", function() {
        console.log("🎯 Network drawing complete - ready for interactions");
      });
    };

    loadVisJS();

    return () => {
      if (network) {
        network.destroy();
      }
    };
  }, [finalData, physicsEnabled, hierarchicalMode]);

  // Effect để cập nhật network options khi state thay đổi - đảm bảo animations hoạt động
  useEffect(() => {
    if (network) {
      console.log("🔄 Updating network options - Physics:", physicsEnabled, "Hierarchical:", hierarchicalMode);
      network.setOptions({
        physics: {
          enabled: physicsEnabled,
          forceAtlas2Based: {
            gravitationalConstant: -26,
            centralGravity: 0.005,
            springLength: 230,
            springConstant: 0.18,
            damping: 0.4,
            avoidOverlap: 0.5
          },
          maxVelocity: 146,
          minVelocity: 0.75,
          solver: 'forceAtlas2Based',
          stabilization: {
            enabled: true,
            iterations: 2000,
            updateInterval: 25
          },
          timestep: 0.35,
          adaptiveTimestep: true
        },
        layout: {
          improvedLayout: true,
          hierarchical: {
            enabled: hierarchicalMode,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 200,
            levelSeparation: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true
          }
        }
      });
    }
  }, [network, physicsEnabled, hierarchicalMode]);

  // Effect để handle resize khi fullscreen thay đổi - cải thiện
  useEffect(() => {
    if (network && networkRef.current) {
      console.log("🔄 Handling fullscreen resize, isFullscreen:", isFullscreen);
      
      const handleResize = () => {
        if (networkRef.current) {
          const container = networkRef.current;
          const rect = container.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            console.log("📐 Resizing network to:", rect.width, "x", rect.height);
            network.setSize(rect.width.toString() + 'px', rect.height.toString() + 'px');
            network.redraw();
            
            // Fit sau khi resize
            setTimeout(() => {
              network.fit();
            }, 100);
          }
        }
      };
      
      // Handle resize ngay lập tức
      setTimeout(handleResize, 100);
      
      // Thêm window resize listener
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isFullscreen, network]);

  // Effect để thêm ResizeObserver cho container
  useEffect(() => {
    if (network && networkRef.current) {
      console.log("👁️ Setting up ResizeObserver for network container");
      
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            console.log("👁️ Container resized detected:", width, "x", height);
            
            // Update network size
            network.setSize(width + 'px', height + 'px');
            network.redraw();
            
            // Fit after a small delay
            setTimeout(() => {
              network.fit();
            }, 50);
          }
        }
      });
      
      resizeObserver.observe(networkRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [network]);

  // Helper functions - sao chép chính xác từ file HTML
  function removeVietnameseTones(str: string) {
    return str.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/\s+/g, '').toLowerCase();
  }

  function extractUserInfo(node: any) {
    let realName = null;
    if (node.about_info) {
      const abouts = [
        node.about_info.about,
        node.about_info.about_work_and_education,
        node.about_info.about_places,
        node.about_info.about_contact_and_basic_info,
        node.about_info.about_details
      ];
      for (const ab of abouts) {
        if (ab && ab.title && ab.title.trim() !== "") {
          realName = ab.title.trim();
          break;
        }
      }
    }
    if (!realName) {
      realName = node.username || node.id;
    }
    let usernameLabel = null;
    let usernameValue = null;
    if (node.username && node.username.trim() !== "") {
      usernameLabel = "Username";
      usernameValue = node.username;
    } else if (/^\d+$/.test(node.id)) {
      usernameLabel = "UID";
      usernameValue = node.id;
    } else {
      usernameLabel = "Username";
      usernameValue = node.id;
    }
    const info = {
      realName,
      usernameLabel,
      usernameValue,
      hometown: "Không có thông tin",
      education: "Không có thông tin",
      friends: node.friends_count || "0",
      followers: node.followers_count || "0",
      relationship: null,
      profile_url: node.profile_url || "#",
      email: null,
      social: {} as any,
      birthday: null,
      layer: typeof node.layer === 'number' ? node.layer : null,
      currentRelationship: null
    };

    const provinces = [
      'An Giang','Bà Rịa - Vũng Tàu','Bạc Liêu','Bắc Giang','Bắc Kạn','Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau','Cao Bằng','Cần Thơ','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội','Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên','Huế','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh','Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái'
    ];

    if (node.about_info && node.about_info.about && node.about_info.about.content && node.about_info.about.content.general) {
      const general = node.about_info.about.content.general;
      const hometownIndex = general.findIndex((item: string) => item.includes("Đến từ"));
      if (hometownIndex !== -1) {
        info.hometown = general[hometownIndex].replace("Đến từ", "").trim();
      }
      // Ưu tiên lấy từ about_work_and_education
      if (node.about_info && node.about_info.about_work_and_education && node.about_info.about_work_and_education.content && node.about_info.about_work_and_education.content.general) {
        const eduArr = node.about_info.about_work_and_education.content.general;
        // Lấy các dòng có từ 'học', 'đại học', ... nhưng loại bỏ các dòng không mong muốn và các dòng chỉ có mỗi 'Đại học', 'Cao đẳng', ...
        const eduLines = eduArr.filter((item: string) =>
          /học|đại học|học tại|từng học tại|đã học tại/i.test(item) &&
          !/trường trung học|trung học|secondary|high school|không có trường học nào để hiển thị|không có trường học|no school/i.test(item) &&
          !/^(đại học|cao đẳng|trường trung học|trung học)$/i.test(item.trim())
        );
        if (eduLines.length > 0) {
          info.education = eduLines.join('; ');
        } else {
          info.education = "Không có thông tin";
        }
      }
      // Nếu không có, fallback sang about
      if (info.education === 'Không có thông tin' && node.about_info && node.about_info.about && node.about_info.about.content && node.about_info.about.content.general) {
        const general = node.about_info.about.content.general;
        const eduLines = general.filter((item: string) =>
          /học|đại học|học tại|từng học tại|đã học tại/i.test(item) &&
          !/trường trung học|trung học|secondary|high school|không có trường học nào để hiển thị|không có trường học|no school/i.test(item) &&
          !/^(đại học|cao đẳng|trường trung học|trung học)$/i.test(item.trim())
        );
        if (eduLines.length > 0) {
          info.education = eduLines.join('; ');
        } else {
          info.education = "Không có thông tin";
        }
      }
    }

    if (info.hometown === 'Không có thông tin') {
      let fromStr = null;
      if (node.about_info && node.about_info.about && node.about_info.about.content && node.about_info.about.content.general) {
        const general = node.about_info.about.content.general;
        const fromIdx = general.findIndex((item: string) => item.toLowerCase().includes('đến từ'));
        if (fromIdx !== -1) {
          fromStr = general[fromIdx].replace(/đến từ/gi, '').trim();
        }
        if (!fromStr) {
          const liveIdx = general.findIndex((item: string) => /sống tại|living in|lives in/i.test(item));
          if (liveIdx !== -1) {
            fromStr = general[liveIdx].replace(/sống tại|living in|lives in/gi, '').trim();
          }
        }
      }
      if (!fromStr && node.about_info && node.about_info.about_work_and_education && node.about_info.about_work_and_education.content && node.about_info.about_work_and_education.content.general) {
        const eduArr = node.about_info.about_work_and_education.content.general;
        const hsArr = eduArr.filter((item: string) =>
          (/thpt|trung học|high school|chuyên|secondary|school/i.test(item)) &&
          !(/đại học|university|college/i.test(item))
        );
        if (hsArr.length > 0) {
          fromStr = hsArr.join(' ');
        }
      }
      if (!fromStr && node.about_info && node.about_info.about_places && node.about_info.about_places.content && node.about_info.about_places.content.general) {
        const places = node.about_info.about_places.content.general.join(' ');
        fromStr = places;
      }
      if (fromStr) {
        const fromStrNorm = removeVietnameseTones(fromStr);
        for (const prov of provinces) {
          const provNorm = removeVietnameseTones(prov);
          if (fromStrNorm.includes(provNorm)) {
            info.hometown = prov;
            break;
          }
        }
      }
    }

    if (node.about_info && node.about_info.about_contact_and_basic_info && node.about_info.about_contact_and_basic_info.content && node.about_info.about_contact_and_basic_info.content.general) {
      const general = node.about_info.about_contact_and_basic_info.content.general;
      for (let i = 0; i < general.length; i++) {
        if (general[i].toLowerCase().includes("email")) {
          if (i > 0 && general[i-1].includes("@")) info.email = general[i-1];
          else if (i < general.length-1 && general[i+1].includes("@")) info.email = general[i+1];
        }
      }
      const socialList = ["instagram", "x", "tiktok", "facebook", "twitter", "youtube", "linkedin"];
      let socialStart = general.findIndex((item: string) => item.toLowerCase().includes("các trang web và liên kết mạng xã hội"));
      if (socialStart !== -1) {
        const invalidLabels = [
          'thông tin cơ bản', 'giới tính', 'nam', 'nữ', 'ngày sinh', 'năm sinh', 'email', 'x', 'instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'linkedin', 'trang web', 'website', 'zalo', 'số điện thoại', 'điện thoại', 'liên hệ', 'thông tin liên hệ'
        ];
        for (let i = socialStart + 1; i < general.length-1; i++) {
          for (const mxh of socialList) {
            if (general[i+1].toLowerCase().includes(mxh)) {
              const val = general[i];
              if (!val.includes("@") && !info.social[mxh] && !val.match(/\s/) && !invalidLabels.includes(val.trim().toLowerCase())) {
                info.social[mxh] = val;
              }
            }
          }
        }
      }

      let day = null, month = null, year = null;
      for (let i = 0; i < general.length; i++) {
        if (general[i].toLowerCase().includes("ngày sinh")) {
          if (i > 0 && general[i-1].match(/\d{1,2} tháng \d{1,2}/)) {
            const [d, m] = general[i-1].split(" tháng ");
            day = d.trim();
            month = m.trim();
          } else if (i < general.length-1 && general[i+1].match(/\d{1,2} tháng \d{1,2}/)) {
            const [d, m] = general[i+1].split(" tháng ");
            day = d.trim();
            month = m.trim();
          }
        }
        if (general[i].toLowerCase().includes("năm sinh")) {
          if (i > 0 && general[i-1].match(/^\d{4}$/)) year = general[i-1];
          else if (i < general.length-1 && general[i+1].match(/^\d{4}$/)) year = general[i+1];
        }
      }
      if (day && month && year) info.birthday = `${day.padStart(2,'0')}/${month.padStart(2,'0')}/${year}`;
      else if (day && month) info.birthday = `${day.padStart(2,'0')}/${month.padStart(2,'0')}`;
      else if (year) info.birthday = year;

      // Tìm link locket.cam trong general
      for (let i = 0; i < general.length; i++) {
        if (typeof general[i] === 'string' && general[i].includes('locket.cam')) {
          info.social.locket = general[i];
        }
      }
    }

    if (node.about_info && node.about_info.about_family_and_relationships && node.about_info.about_family_and_relationships.content && node.about_info.about_family_and_relationships.content.general) {
      const rel = node.about_info.about_family_and_relationships.content.general;
      const idx = rel.findIndex((item: string) => item.toLowerCase().includes("mối quan hệ"));
      if (idx !== -1 && rel[idx+1] && !rel[idx+1].toLowerCase().includes("thành viên")) {
        info.relationship = rel[idx+1];
      }
    }

    // Lấy mối quan hệ hiện tại (ví dụ: Độc thân, Đã kết hôn, ...)
    let currentRelationship = null;
    if (node.about_info && node.about_info.about_family_and_relationships && node.about_info.about_family_and_relationships.content && node.about_info.about_family_and_relationships.content.general) {
      const rel = node.about_info.about_family_and_relationships.content.general;
      const idx = rel.findIndex((item: string) => item.toLowerCase().includes('mối quan hệ'));
      if (idx !== -1 && rel[idx+1] && !rel[idx+1].toLowerCase().includes('thành viên')) {
        const val = rel[idx+1].trim();
        if (val && val.toLowerCase() !== 'không có thông tin mối quan hệ nào để hiển thị') {
          currentRelationship = val;
        }
      }
    }
    info.currentRelationship = currentRelationship;
    return info;
  }

  function extractNodesAndEdges(tree: any) {
    const nodes: any[] = [];
    const edges: any[] = [];
    const seenIds = new Set();
    const tooltips: any = {};

    console.log('🌳 Starting extractNodesAndEdges with tree:', tree);
    console.log('🔍 Tree type:', typeof tree);
    console.log('🔍 Tree has id:', !!tree?.id);
    console.log('🔍 Tree id value:', tree?.id);
    console.log('🔍 Tree has children:', !!tree?.children);
    console.log('🔍 Tree children length:', tree?.children?.length);

    function traverse(node: any, currentLayer: number) {
      console.log(`🔍 Traversing node at layer ${currentLayer}:`, node?.id || 'NO_ID');
      console.log('🔍 Node structure:', { id: node?.id, username: node?.username, title: node?.title, hasChildren: !!node?.children });
      
      if (!node || !node.id || seenIds.has(node.id)) {
        console.log(`⚠️ Skipping node: ${!node ? 'null' : !node.id ? 'no ID' : 'already seen'}`);
        return;
      }

      const userInfo = extractUserInfo(node);
      userInfo.layer = currentLayer;

      console.log(`✅ Processing node: ${userInfo.realName} (${node.id}) at layer ${currentLayer}`);

      // Tạo tooltip chi tiết như network.html
      let socialHtml = '';
      const socialLinks: any = {
        instagram: (u: string) => `https://instagram.com/${u}`,
        x: (u: string) => `https://x.com/${u}`,
        tiktok: (u: string) => `https://www.tiktok.com/@${u}`,
        facebook: (u: string) => `https://facebook.com/${u}`,
        twitter: (u: string) => `https://twitter.com/${u}`,
        youtube: (u: string) => `https://youtube.com/@${u}`,
        linkedin: (u: string) => `https://linkedin.com/in/${u}`,
        locket: (u: string) => u // locket.cam links are already full URLs
      };

      for (const [mxh, username] of Object.entries(userInfo.social)) {
        const label = mxh.charAt(0).toUpperCase() + mxh.slice(1);
        if (username && socialLinks[mxh]) {
          if (mxh === 'locket') {
            // Locket links are already full URLs
            socialHtml += `<div class="node-tooltip-row"><span class="node-tooltip-label">${label}:</span> <a href="${username}" target="_blank" style="color: #3498db; text-decoration: none;">${username}</a></div>`;
          } else {
            socialHtml += `<div class="node-tooltip-row"><span class="node-tooltip-label">${label}:</span> <a href="${socialLinks[mxh](username)}" target="_blank" style="color: #3498db; text-decoration: none;">${username}</a></div>`;
          }
        } else if (username) {
          socialHtml += `<div class="node-tooltip-row"><span class="node-tooltip-label">${label}:</span> <span style="color: #3498db;">${username}</span></div>`;
        }
      }

      tooltips[node.id] = `
        <div class="node-tooltip">
          <div class="node-tooltip-header">${userInfo.realName}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">${userInfo.usernameLabel}:</span> ${userInfo.usernameValue}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Tầng:</span> ${userInfo.layer}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Quê quán:</span> ${userInfo.hometown}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Học tại:</span> ${userInfo.education}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Bạn bè:</span> ${userInfo.friends}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Người theo dõi:</span> ${userInfo.followers}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Mối quan hệ hiện tại:</span> ${userInfo.currentRelationship || 'Không có thông tin hiển thị'}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Email:</span> ${userInfo.email || 'Không có'}</div>
          ${socialHtml}
          <div class="node-tooltip-row"><span class="node-tooltip-label">Ngày sinh:</span> ${userInfo.birthday || 'Không có'}</div>
          <div class="node-tooltip-row"><span class="node-tooltip-label">Trang cá nhân:</span> <a href="${userInfo.profile_url}" target="_blank" style="color: #3498db; text-decoration: none;">Mở liên kết</a></div>
        </div>
      `;

      // Sao chép logic từ file HTML
      const rootUser = finalData.root_user;
      console.log(`🎨 Processing node: ${node.id}`);
      console.log(`🎨 Root user from data: "${rootUser}"`);
      console.log(`🎨 Current layer: ${currentLayer}`);
      console.log(`🎨 Node ID type: ${typeof node.id}, Root type: ${typeof rootUser}`);
      
      // Cải thiện logic xác định root node
      const isRoot = (currentLayer === 0) || (String(node.id).toLowerCase() === String(rootUser).toLowerCase());
      console.log(`🎨 Is root node: ${isRoot}`);
      
      // Màu sắc rõ ràng hơn
      const nodeColor = isRoot ? '#e74c3c' : '#3498db';  // Đỏ cho root, xanh dương cho con
      const borderColor = isRoot ? '#c0392b' : '#2980b9';
      const highlightColor = isRoot ? '#ff6b6b' : '#5dade2';
      const highlightBorder = isRoot ? '#e74c3c' : '#3498db';
      
      // Kích thước rõ ràng: root phải lớn nhất
      let nodeSize = 12; // default cho layer 3+
      if (isRoot) {
        nodeSize = 30; // Tăng kích thước root lên 30
      } else if (currentLayer === 1) {
        nodeSize = 22; // Layer 1
      } else if (currentLayer === 2) {
        nodeSize = 18; // Layer 2
      }
      
      console.log(`🎨 Final styling - Color: ${nodeColor}, Size: ${nodeSize}, IsRoot: ${isRoot}`);
      
      nodes.push({
        id: node.id,
        label: node.title || node.username || node.id,
        color: {
          background: nodeColor,
          border: borderColor,
          highlight: {
            background: highlightColor,
            border: highlightBorder
          }
        },
        shape: 'dot',
        size: nodeSize,
        borderWidth: 2,
        shadow: true,
        level: userInfo.layer
      });
      seenIds.add(node.id);
      console.log(`📊 Added node to network: ${userInfo.realName} (${node.id}). Total nodes: ${nodes.length}`);

      if (node.children && node.children.length > 0) {
        console.log(`👥 Node ${node.id} has ${node.children.length} children:`, node.children.map((c: any) => c?.id || 'NO_ID'));
        node.children.forEach((child: any) => {
          if (!seenIds.has(child.id)) {
            console.log(`🔗 Creating edge: ${node.id} -> ${child.id}`);
            traverse(child, currentLayer + 1);
            const edgeId = `${node.id}_${child.id}`;
            edges.push({ 
              id: edgeId,
              from: node.id, 
              to: child.id,
              width: 2,
              color: {
                color: '#848484',
                highlight: '#848484',
                hover: '#848484',
                inherit: false
              },
              smooth: {
                type: 'curvedCW',
                roundness: 0.2
              }
            });
            console.log(`🔗 Added edge: ${edgeId}. Total edges: ${edges.length}`);
          }
        });
      } else {
        console.log(`👥 Node ${node.id} has no children (${!node.children ? 'undefined' : !Array.isArray(node.children) ? 'not array' : 'empty array'})`);
      }
    }

    traverse(tree, 0);
    console.log(`🎯 Final result: ${nodes.length} nodes, ${edges.length} edges`);
    return { nodes, edges, tooltips };
  }

  const handleZoomIn = () => {
    if (network) {
      // Sử dụng method gốc của vis-network cho performance tốt hơn
      network.zoomIn(0.2);
    }
  };

  const handleZoomOut = () => {
    if (network) {
      // Sử dụng method gốc của vis-network cho performance tốt hơn
      network.zoomOut(0.2);
    }
  };

  const handleFit = () => {
    if (network) {
      console.log("🎯 Fitting network view");
      
      // Redraw trước khi fit để đảm bảo nodes hiển thị
      network.redraw();
      
      // Fit với animation sau một chút delay
      setTimeout(() => {
        network.fit({
          animation: {
            duration: 600,
            easingFunction: "easeInOutCubic"
          }
        });
      }, 50);
    }
  };

  const togglePhysics = () => {
    setPhysicsEnabled(!physicsEnabled);
    if (network) {
      console.log("🔄 Toggling physics to:", !physicsEnabled);
      
      // Đơn giản hóa - chỉ toggle enabled state
      network.setOptions({ 
        physics: { 
          enabled: !physicsEnabled
        }
      });

      // Smooth simulation control
      if (!physicsEnabled) {
        // Bật physics - restart simulation với smooth transition
        setTimeout(() => {
          network.startSimulation();
        }, 100);
      } else {
        // Tắt physics - stop simulation smoothly
        network.stopSimulation();
      }
    }
  };

  const toggleHierarchical = () => {
    setHierarchicalMode(!hierarchicalMode);
    if (network) {
      console.log("🔄 Toggling hierarchical to:", !hierarchicalMode);
      
      // Đơn giản hóa layout toggle
      network.setOptions({ 
        layout: { 
          hierarchical: {
            enabled: !hierarchicalMode,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 200,
            levelSeparation: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true
          }
        }
      });

      // Smooth fit sau layout change
      setTimeout(() => {
        network.fit({
          animation: {
            duration: 800,
            easingFunction: "easeInOutCubic"
          }
        });
      }, 200);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Force complete network re-initialization
    setTimeout(() => {
      if (network && networkRef.current) {
        console.log("🔄 Force re-initializing network for fullscreen");
        
        // Destroy current network
        network.destroy();
        
        // Re-create network với data và options hiện tại
        setTimeout(() => {
          if (networkRef.current) {
            const vis = (window as any).vis;
            if (vis && finalData && finalData.tree_data) {
              console.log("🔄 Recreating network instance");
              
              // Extract data lại
              const { nodes, edges, tooltips } = extractNodesAndEdges(finalData.tree_data);
              
              const visData = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
              };

              const options = {
                nodes: {
                  font: { 
                    size: 14,
                    face: 'Arial',
                    color: '#333333'
                  },
                  borderWidth: 2,
                  shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.5)',
                    size: 10,
                    x: 5,
                    y: 5
                  },
                  chosen: false
                },
                edges: {
                  width: 2,
                  shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.5)',
                    size: 10,
                    x: 5,
                    y: 5
                  },
                  smooth: {
                    enabled: true,
                    type: 'dynamic',
                    roundness: 0.5
                  },
                  chosen: false
                },
                interaction: {
                  hover: true,
                  hideEdgesOnDrag: false,
                  multiselect: true,
                  tooltipDelay: 200,
                  hideNodesOnDrag: false
                },
                physics: {
                  enabled: physicsEnabled,
                  forceAtlas2Based: {
                    gravitationalConstant: -26,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18,
                    damping: 0.4,
                    avoidOverlap: 0.5
                  },
                  maxVelocity: 146,
                  minVelocity: 0.75,
                  solver: 'forceAtlas2Based',
                  stabilization: {
                    enabled: true,
                    iterations: 2000,
                    updateInterval: 25
                  },
                  timestep: 0.35,
                  adaptiveTimestep: true
                },
                layout: {
                  improvedLayout: true,
                  hierarchical: {
                    enabled: hierarchicalMode,
                    direction: 'UD',
                    sortMethod: 'directed',
                    nodeSpacing: 200,
                    levelSeparation: 200,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true
                  }
                }
              };

              // Create new network instance
              const newNetwork = new vis.Network(networkRef.current, visData, options);
              setNetwork(newNetwork);
              
              // Setup all event handlers again
              setupNetworkEvents(newNetwork, tooltips, visData);
              
              // Fit sau khi tạo xong
              setTimeout(() => {
                newNetwork.fit({
                  animation: {
                    duration: 600,
                    easingFunction: "easeInOutCubic"
                  }
                });
              }, 500);
            }
          }
        }, 100);
      }
    }, 300);
  };

  // Helper function để setup network events
  const setupNetworkEvents = (networkInstance: any, tooltips: any, visData: any) => {
    // Hàm tìm edge nối node với node cha
    const getParentEdges = (nodeId: string) => {
      return visData.edges.get().filter((edge: any) => edge.to === nodeId);
    };

    // Lưu lại các edge đã đổi màu để hoàn nguyên
    let highlightedEdges: any[] = [];

    const highlightParentEdges = (nodeId: string) => {
      // Reset edges cũ trước
      resetParentEdges();
      
      const parentEdges = getParentEdges(nodeId);
      console.log(`🔗 Highlighting edges for node ${nodeId}:`, parentEdges);
      
      highlightedEdges = parentEdges.map((edge: any) => {
        const edgeId = edge.id || `${edge.from}_${edge.to}`;
        console.log(`🔗 Highlighting edge: ${edgeId}`);
        
        // Update edge với màu xanh lá cây đậm
        visData.edges.update({
          id: edgeId,
          color: { 
            color: '#00ff00', 
            highlight: '#00ff00', 
            hover: '#00ff00',
            inherit: false
          },
          width: 5
        });
        
        return { id: edgeId, originalColor: edge.color, originalWidth: edge.width };
      });
    };

    const resetParentEdges = () => {
      highlightedEdges.forEach(edgeInfo => {
        console.log(`🔗 Resetting edge: ${edgeInfo.id}`);
        visData.edges.update({
          id: edgeInfo.id,
          color: { 
            color: '#848484', 
            highlight: '#848484', 
            hover: '#848484',
            inherit: false
          },
          width: 2
        });
      });
      highlightedEdges = [];
    };

    // Setup all events
    networkInstance.on("hoverNode", function(params: any) {
      if (isDragging || isViewDragging) {
        console.log("🚫 Blocking tooltip - drag in progress");
        return;
      }
      
      setTimeout(() => {
        if (isDragging || isViewDragging) {
          console.log("🚫 Blocking tooltip - drag detected in delay");
          return;
        }
        
        const nodeId = params.node;
        highlightParentEdges(nodeId);
        if (tooltips[nodeId] && tooltipRef.current) {
          console.log("✅ Showing tooltip for node:", nodeId);
          tooltipRef.current.innerHTML = tooltips[nodeId];
          tooltipRef.current.style.display = 'block';
          
          // Smart positioning
          tooltipRef.current.style.left = '0px';
          tooltipRef.current.style.top = '0px';
          
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          const mouseX = params.event.clientX;
          const mouseY = params.event.clientY;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const margin = 15;
          
          let tooltipX = mouseX + margin;
          let tooltipY = mouseY + margin;
          
          if (tooltipX + tooltipWidth > viewportWidth - margin) {
            tooltipX = mouseX - tooltipWidth - margin;
          }
          
          if (tooltipY + tooltipHeight > viewportHeight - margin) {
            tooltipY = mouseY - tooltipHeight - margin;
          }
          
          if (tooltipX < margin) {
            tooltipX = margin;
          }
          
          if (tooltipY < margin) {
            tooltipY = margin;
          }
          
          tooltipRef.current.style.left = tooltipX + 'px';
          tooltipRef.current.style.top = tooltipY + 'px';
        }
      }, 50);
    });

    networkInstance.on("blurNode", function() {
      resetParentEdges();
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    });

    // Drag events
    let dragTimeout: NodeJS.Timeout | null = null;

    networkInstance.on("dragStart", function(params: any) {
      console.log("🔥 Drag started");
      setIsDragging(true);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      resetParentEdges();
      
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
      }
    });

    networkInstance.on("dragging", function(params: any) {
      setIsDragging(true);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      resetParentEdges();
    });

    networkInstance.on("dragEnd", function(params: any) {
      console.log("🔥 Drag ended");
      dragTimeout = setTimeout(() => {
        console.log("🔥 Allowing tooltip after drag");
        setIsDragging(false);
        dragTimeout = null;
      }, 300);
    });

    networkInstance.on("zoom", function(params: any) {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      resetParentEdges();
    });

    networkInstance.on("press", function(params: any) {
      if (params.nodes.length === 0) {
        setIsViewDragging(true);
        setIsDragging(true);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
        resetParentEdges();
      }
    });

    networkInstance.on("release", function(params: any) {
      if (isViewDragging) {
        setIsViewDragging(false);
        setTimeout(() => {
          setIsDragging(false);
        }, 400);
      }
    });

    networkInstance.on("selectNode", function(params: any) {
      const nodeId = params.nodes[0];
      highlightParentEdges(nodeId);
    });

    networkInstance.on("deselectNode", function() {
      resetParentEdges();
    });
  };

  if (!finalData || !finalData.tree_data) {
    const errorContent = (
      <div className="w-full h-full relative bg-gray-900 flex flex-col items-center justify-center">
        <Network className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Network Data</h3>
        <p className="text-gray-400 text-center">
          No tree data available to generate network diagram.
        </p>
        
        {/* Debug panel để hiển thị data thực tế */}
        <div className="mt-4 w-full max-w-2xl">
          <details className="bg-red-900/20 border border-red-500/30 rounded p-3">
            <summary className="text-red-300 cursor-pointer text-sm">🐛 Debug Info (Click to expand)</summary>
            <div className="mt-2 text-xs text-gray-300">
              <p><strong>Data received:</strong> {data ? 'Yes' : 'No'}</p>
              <p><strong>Data type:</strong> {typeof data}</p>
              <p><strong>Data keys:</strong> {data ? Object.keys(data).join(', ') : 'None'}</p>
              <p><strong>Has tree_data:</strong> {data?.tree_data ? 'Yes' : 'No'}</p>
              <p><strong>Root user:</strong> {data?.root_user || 'None'}</p>
              <p><strong>Using test data:</strong> {finalData === testData ? 'Yes' : 'No'}</p>
              {data && (
                <pre className="mt-2 text-xs bg-black/50 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          </details>
        </div>
      </div>
    );

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-[9999] bg-gray-900">
          <Button 
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-[10000] bg-red-600 hover:bg-red-700 p-2"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
          {errorContent}
        </div>
      );
    }

    return (
      <div className="w-full h-[600px] relative">
        <Button 
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 p-2"
          size="sm"
          title="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </Button>
        {errorContent}
      </div>
    );
  }

  const networkContent = (
    <div className={`relative bg-white ${isFullscreen ? 'w-full h-full' : 'w-full h-full'}`}>
      {/* Header bar giống HTML gốc */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/80 text-white p-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Network Diagram</span>
          {isFullscreen && (
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Fullscreen Mode
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {finalData.root_user || 'Root User'}
        </Badge>
      </div>

      {/* Controls giống HTML gốc */}
      <div className="absolute top-5 right-5 z-30 flex flex-col gap-2 bg-white p-2 rounded shadow-lg">
        <Button size="sm" onClick={handleZoomIn} className="bg-blue-600 hover:bg-blue-700 p-2" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={handleZoomOut} className="bg-blue-600 hover:bg-blue-700 p-2" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={handleFit} className="bg-blue-600 hover:bg-blue-700 p-2" title="Fit">
          <Maximize className="w-4 h-4" />
        </Button>
        <Button 
          size="sm" 
          onClick={togglePhysics} 
          className={`${physicsEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} p-2`}
          title="Toggle Physics"
        >
          {physicsEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button 
          size="sm" 
          onClick={toggleHierarchical} 
          className={`${hierarchicalMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'} p-2`}
          title="Toggle Hierarchical"
        >
          H
        </Button>
        {/* Fullscreen toggle button */}
        <Button 
          size="sm" 
          onClick={toggleFullscreen} 
          className={`${isFullscreen ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} p-2`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>

      {/* Network Container - toàn màn hình như HTML gốc */}
      <div 
        ref={networkRef} 
        style={{ 
          width: '100%', 
          height: isFullscreen ? '100vh' : '100%', 
          border: '1px solid lightgray',
          margin: 0,
          padding: 0
        }}
      />

      {/* Tooltip - giống hệt HTML gốc */}
      <div 
        ref={tooltipRef}
        id="custom-tooltip"
        style={{
          position: 'absolute',
          display: 'none',
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #d3d3d3',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          maxWidth: '300px',
          pointerEvents: 'auto'
        }}
      />
    </div>
  );

  // Render fullscreen modal nếu isFullscreen = true
  if (isFullscreen) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
          {networkContent}
        </div>
      </div>,
      document.body
    );
  }

  // Render bình thường trong container
  return (
    <div className="w-full h-[600px] relative">
      {networkContent}
    </div>
  );
};