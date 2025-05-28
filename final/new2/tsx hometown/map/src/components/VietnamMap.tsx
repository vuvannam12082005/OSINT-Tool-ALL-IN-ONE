
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ProvinceData, ProvinceInfo, ProvinceGeo } from '../types/ProvinceData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VietnamMapProps {
  data: ProvinceData[];
}

export const VietnamMap: React.FC<VietnamMapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Danh sách vị trí địa lý của các tỉnh/thành phố Việt Nam (cập nhật để chính xác hơn)
  const provinceGeo: Record<string, ProvinceGeo> = {
    'An Giang': {lat: 10.5216, lon: 105.1259},
    'Bà Rịa - Vũng Tàu': {lat: 10.5417, lon: 107.2429},
    'Bạc Liêu': {lat: 9.2941, lon: 105.7278},
    'Bắc Giang': {lat: 21.2731, lon: 106.1950},
    'Bắc Kạn': {lat: 22.1472, lon: 105.8348},
    'Bắc Ninh': {lat: 21.1861, lon: 106.0763},
    'Bến Tre': {lat: 10.2333, lon: 106.3756},
    'Bình Dương': {lat: 11.3254, lon: 106.4770},
    'Bình Định': {lat: 14.1665, lon: 109.0122},
    'Bình Phước': {lat: 11.7511, lon: 106.7234},
    'Bình Thuận': {lat: 11.0904, lon: 108.0721},
    'Cà Mau': {lat: 9.1797, lon: 105.1524},
    'Cao Bằng': {lat: 22.6657, lon: 106.2578},
    'Cần Thơ': {lat: 10.0452, lon: 105.7469},
    'Đà Nẵng': {lat: 16.0544, lon: 108.2022},
    'Đắk Lắk': {lat: 12.7100, lon: 108.2378},
    'Đắk Nông': {lat: 12.2646, lon: 107.6098},
    'Điện Biên': {lat: 21.3860, lon: 103.0230},
    'Đồng Nai': {lat: 10.9447, lon: 106.8243},
    'Đồng Tháp': {lat: 10.4603, lon: 105.6324},
    'Gia Lai': {lat: 13.9833, lon: 108.0000},
    'Hà Giang': {lat: 22.8025, lon: 104.9784},
    'Hà Nam': {lat: 20.5453, lon: 105.9122},
    'Hà Nội': {lat: 21.0285, lon: 105.8542},
    'Hà Tĩnh': {lat: 18.3561, lon: 105.8906},
    'Hải Dương': {lat: 20.9373, lon: 106.3148},
    'Hải Phòng': {lat: 20.8449, lon: 106.6881},
    'Hậu Giang': {lat: 9.7847, lon: 105.4701},
    'Hòa Bình': {lat: 20.6861, lon: 105.3131},
    'Hưng Yên': {lat: 20.6464, lon: 106.0511},
    'Huế': {lat: 16.4637, lon: 107.5909},
    'Khánh Hòa': {lat: 12.2451, lon: 109.1943},
    'Kiên Giang': {lat: 10.0159, lon: 105.0809},
    'Kon Tum': {lat: 14.3497, lon: 107.9755},
    'Lai Châu': {lat: 22.3857, lon: 103.4701},
    'Lạng Sơn': {lat: 21.8564, lon: 106.7610},
    'Lào Cai': {lat: 22.4856, lon: 103.9707},
    'Lâm Đồng': {lat: 11.9755, lon: 108.4419},
    'Long An': {lat: 10.6956, lon: 106.2431},
    'Nam Định': {lat: 20.4388, lon: 106.1621},
    'Nghệ An': {lat: 19.2342, lon: 104.9200},
    'Ninh Bình': {lat: 20.2506, lon: 105.9744},
    'Ninh Thuận': {lat: 11.6739, lon: 108.8629},
    'Phú Thọ': {lat: 21.4010, lon: 105.2280},
    'Phú Yên': {lat: 13.0882, lon: 109.3092},
    'Quảng Bình': {lat: 17.6102, lon: 106.3487},
    'Quảng Nam': {lat: 15.5393, lon: 108.0208},
    'Quảng Ngãi': {lat: 15.1214, lon: 108.8044},
    'Quảng Ninh': {lat: 21.0064, lon: 107.2925},
    'Quảng Trị': {lat: 16.7943, lon: 107.0065},
    'Sóc Trăng': {lat: 9.6003, lon: 105.9800},
    'Sơn La': {lat: 21.3256, lon: 103.9188},
    'Tây Ninh': {lat: 11.3100, lon: 106.0960},
    'Thái Bình': {lat: 20.4463, lon: 106.3400},
    'Thái Nguyên': {lat: 21.5674, lon: 105.8252},
    'Thanh Hóa': {lat: 19.8069, lon: 105.7851},
    'Tiền Giang': {lat: 10.4493, lon: 106.3420},
    'TP. Hồ Chí Minh': {lat: 10.8231, lon: 106.6297},
    'Trà Vinh': {lat: 9.9472, lon: 106.3423},
    'Tuyên Quang': {lat: 21.8233, lon: 105.2142},
    'Vĩnh Long': {lat: 10.2397, lon: 105.9571},
    'Vĩnh Phúc': {lat: 21.3089, lon: 105.6049},
    'Yên Bái': {lat: 21.7167, lon: 104.8986}
  };

  const validProvinces = Object.keys(provinceGeo);

  // Hàm chuyển đổi lat/lon sang vị trí SVG với tỷ lệ chính xác hơn
  const latLonToXY = (lat: number, lon: number, width: number, height: number) => {
    const minLat = 8.4, maxLat = 23.4;
    const minLon = 102.2, maxLon = 109.6;
    
    const padding = 40;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    
    const x = ((lon - minLon) / (maxLon - minLon)) * usableWidth + padding;
    const y = ((maxLat - lat) / (maxLat - minLat)) * usableHeight + padding;
    return { x, y };
  };

  const normalizeProvinceName = (province: string): string | null => {
    const provinceMap: Record<string, string> = {
      'an giang': 'An Giang',
      'ba ria - vung tau': 'Bà Rịa - Vũng Tàu',
      'bac lieu': 'Bạc Liêu',
      'bac giang': 'Bắc Giang',
      'bac kan': 'Bắc Kạn',
      'bac ninh': 'Bắc Ninh',
      'ben tre': 'Bến Tre',
      'binh dinh': 'Bình Định',
      'binh duong': 'Bình Dương',
      'binh phuoc': 'Bình Phước',
      'binh thuan': 'Bình Thuận',
      'ca mau': 'Cà Mau',
      'cao bang': 'Cao Bằng',
      'can tho': 'Cần Thơ',
      'da nang': 'Đà Nẵng',
      'dak lak': 'Đắk Lắk',
      'dak nong': 'Đắk Nông',
      'dien bien': 'Điện Biên',
      'dong nai': 'Đồng Nai',
      'dong thap': 'Đồng Tháp',
      'gia lai': 'Gia Lai',
      'ha giang': 'Hà Giang',
      'ha nam': 'Hà Nam',
      'ha noi': 'Hà Nội',
      'ha tinh': 'Hà Tĩnh',
      'hai duong': 'Hải Dương',
      'hai phong': 'Hải Phòng',
      'hau giang': 'Hậu Giang',
      'hoa binh': 'Hòa Bình',
      'hung yen': 'Hưng Yên',
      'hue': 'Huế',
      'khanh hoa': 'Khánh Hòa',
      'kien giang': 'Kiên Giang',
      'kon tum': 'Kon Tum',
      'lai chau': 'Lai Châu',
      'lam dong': 'Lâm Đồng',
      'lang son': 'Lạng Sơn',
      'lao cai': 'Lào Cai',
      'long an': 'Long An',
      'nam dinh': 'Nam Định',
      'nghe an': 'Nghệ An',
      'ninh binh': 'Ninh Bình',
      'ninh thuan': 'Ninh Thuận',
      'phu tho': 'Phú Thọ',
      'phu yen': 'Phú Yên',
      'quang binh': 'Quảng Bình',
      'quang nam': 'Quảng Nam',
      'quang ngai': 'Quảng Ngãi',
      'quang ninh': 'Quảng Ninh',
      'quang tri': 'Quảng Trị',
      'soc trang': 'Sóc Trăng',
      'son la': 'Sơn La',
      'tay ninh': 'Tây Ninh',
      'thai binh': 'Thái Bình',
      'thai nguyen': 'Thái Nguyên',
      'thanh hoa': 'Thanh Hóa',
      'tien giang': 'Tiền Giang',
      'tp. ho chi minh': 'TP. Hồ Chí Minh',
      'ho chi minh city': 'TP. Hồ Chí Minh',
      'tra vinh': 'Trà Vinh',
      'tuyen quang': 'Tuyên Quang',
      'vinh long': 'Vĩnh Long',
      'vinh phuc': 'Vĩnh Phúc',
      'yen bai': 'Yên Bái'
    };

    const parts = province.split(',').map(p => p.trim());
    for (let i = parts.length - 1; i >= 0; i--) {
      let p = parts[i].toLowerCase();
      p = p.replace(/^(tỉnh|thành phố|tp\.?|province|city)\s+/i, '');
      
      if (provinceMap[p] && validProvinces.includes(provinceMap[p])) {
        return provinceMap[p];
      }
      
      let capitalized = p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (validProvinces.includes(capitalized)) {
        return capitalized;
      }
    }
    return null;
  };

  const extractHometownData = (data: any): Record<string, number> => {
    const hometowns: Record<string, number> = {};
    
    function processNode(node: any) {
      if (node.about_info && node.about_info.about_places && node.about_info.about_places.content) {
        const general = node.about_info.about_places.content.general;
        if (general && general.length > 0) {
          for (let i = 0; i < general.length; i++) {
            const item = general[i];
            if (typeof item === 'string') {
              if (item === 'Nơi từng sống' || item === 'Quê quán' || item === 'Địa điểm') {
                continue;
              }
              
              const normalizedProvince = normalizeProvinceName(item);
              if (normalizedProvince) {
                hometowns[normalizedProvince] = (hometowns[normalizedProvince] || 0) + 1;
                console.log(`Found province from about_places: ${normalizedProvince} (original: ${item})`);
                break;
              }
            }
          }
        }
      }
      
      if (Object.keys(hometowns).length === 0 && node.about_info && node.about_info.about && node.about_info.about.content) {
        const general = node.about_info.about.content.general;
        if (general && general.length > 0) {
          const hometown = general.find((info: string) => info.startsWith('Đến từ'));
          if (hometown) {
            const province = hometown.replace('Đến từ', '').trim();
            const normalizedProvince = normalizeProvinceName(province);
            if (normalizedProvince) {
              hometowns[normalizedProvince] = (hometowns[normalizedProvince] || 0) + 1;
              console.log(`Found province from about: ${normalizedProvince} (original: ${province})`);
            }
          }
        }
      }
      
      if (node.children) {
        node.children.forEach(processNode);
      }
    }
    
    console.log('Processing data:', data);
    processNode(data.tree_data);
    console.log('Extracted hometowns:', hometowns);
    return hometowns;
  };

  const wrapText = (text: string, maxWidth: number) => {
    const words = text.split(' ');
    if (words.length === 1) return [text];
    
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const testWidth = text.length * 6; // Ước tính độ rộng text
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  };

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll('*').remove();
    d3.selectAll('.tooltip').remove();

    const combinedData: Record<string, number> = {};
    data.forEach(fileData => {
      const hometownData = extractHometownData(fileData.jsonData);
      Object.entries(hometownData).forEach(([province, count]) => {
        combinedData[province] = (combinedData[province] || 0) + count;
      });
    });

    console.log('Combined data:', combinedData);

    if (Object.keys(combinedData).length === 0) {
      const svg = d3.select(svgRef.current);
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('class', 'text-gray-400 text-lg')
        .text('Chưa có dữ liệu về quê quán để hiển thị');
      return;
    }

    const width = 900;
    const height = 650;

    const counts = Object.values(combinedData);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const getRadiusForCount = (count: number) => {
      const baseRadius = 15;
      const maxRadius = 50;
      
      if (minCount === maxCount) {
        return baseRadius + 10;
      }
      
      const ratio = (count - minCount) / (maxCount - minCount);
      return baseRadius + (ratio * (maxRadius - baseRadius));
    };

    const nodes: ProvinceInfo[] = Object.entries(combinedData).map(([province, count]) => {
      if (!provinceGeo[province]) return null;
      const { lat, lon } = provinceGeo[province];
      const { x, y } = latLonToXY(lat, lon, width, height);
      
      const fontSize = 10;
      const lines = wrapText(province, 80);
      const radius = getRadiusForCount(count);
      
      return {
        id: province,
        count: count,
        radius: radius,
        x: x,
        y: y,
        fx: x,
        fy: y,
        lines: lines
      };
    }).filter(Boolean) as ProvinceInfo[];

    // Sắp xếp theo số lượng (nhiều nhất trước để hiển thị sau - z-index thấp hơn)
    nodes.sort((a, b) => b.count - a.count);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .call(
        d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.5, 8])
          .on('zoom', function (event) {
            g.attr('transform', event.transform);
          })
      );

    const g = svg.append('g');

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '12px 16px')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('border', 'none')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('font-size', '13px')
      .style('box-shadow', '0 4px 15px rgba(0,0,0,0.1)')
      .style('backdrop-filter', 'blur(5px)')
      .style('opacity', 0);

    const simulation = d3.forceSimulation(nodes)
      .force('collision', d3.forceCollide().radius(d => d.radius + 2))
      .alphaDecay(0.1)
      .velocityDecay(0.8)
      .stop();

    const node = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .call(d3.drag<SVGGElement, ProvinceInfo>()
        .on('start', function(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          d3.select(this).raise(); // Đưa node lên trên khi bắt đầu kéo
        })
        .on('drag', function(event, d) {
          d.fx = event.x;
          d.fy = event.y;
          d3.select(this).attr('transform', `translate(${event.x},${event.y})`);
        })
        .on('end', function(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          const originalPos = latLonToXY(provinceGeo[d.id].lat, provinceGeo[d.id].lon, width, height);
          d.fx = originalPos.x;
          d.fy = originalPos.y;
          
          d3.select(this)
            .transition()
            .duration(500)
            .attr('transform', `translate(${originalPos.x},${originalPos.y})`);
          
          // Khôi phục thứ tự z-index sau khi animation hoàn thành
          setTimeout(() => {
            g.selectAll('.node')
              .sort((a: any, b: any) => b.count - a.count); // Số lượng nhiều trước (z-index thấp hơn)
          }, 500);
        })
      );

    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Đưa node hiện tại lên trên khi hover
        d3.select(this.parentNode).raise();
        
        d3.select(this)
          .transition().duration(200)
          .attr('stroke-width', 4)
          .attr('r', d.radius * 1.15)
          .attr('fill-opacity', 0.9);

        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(`<strong>${d.id}</strong><br/>Số người: ${d.count}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr('stroke-width', 2)
          .attr('r', d.radius)
          .attr('fill-opacity', 0.7);

        tooltip.transition().duration(500).style('opacity', 0);
        
        // Khôi phục thứ tự z-index sau khi mouseout
        setTimeout(() => {
          g.selectAll('.node')
            .sort((a: any, b: any) => b.count - a.count); // Số lượng nhiều trước (z-index thấp hơn)
        }, 200);
      });

    // Thêm text vào center của mỗi circle
    node.each(function(d: any) {
      const nodeGroup = d3.select(this);
      const lines = d.lines || [d.id];
      const fontSize = 10;
      const lineHeight = fontSize + 2;
      const totalHeight = lines.length * lineHeight;
      const startY = -totalHeight / 2 + fontSize / 2;

      lines.forEach((line: string, i: number) => {
        nodeGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central') // Căn chỉnh vertical center
          .attr('y', startY + (i * lineHeight))
          .attr('font-size', fontSize)
          .attr('font-weight', 'bold')
          .attr('fill', '#333')
          .attr('pointer-events', 'none')
          .text(line);
      });
    });

    return () => {
      d3.selectAll('.tooltip').remove();
    };
  }, [data]);

  // Chuẩn bị dữ liệu cho biểu đồ cột
  const combinedData: Record<string, number> = {};
  data.forEach(fileData => {
    const hometownData = extractHometownData(fileData.jsonData);
    Object.entries(hometownData).forEach(([province, count]) => {
      combinedData[province] = (combinedData[province] || 0) + count;
    });
  });

  const chartData = Object.entries(combinedData)
    .map(([province, count]) => ({
      province: province,
      shortName: province.length > 12 ? province.substring(0, 10) + '...' : province,
      count: count
    }))
    .sort((a, b) => b.count - a.count);

  // Tính toán chiều cao động cho biểu đồ dựa trên số lượng tỉnh
  const chartHeight = Math.max(300, Math.min(600, chartData.length * 25 + 100));

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <svg
          ref={svgRef}
          className="w-full h-auto max-w-full border border-gray-200 rounded-lg bg-white shadow-inner"
          viewBox="0 0 900 650"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
      
      {data.length > 0 && (
        <>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Hướng dẫn sử dụng:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Hover chuột lên các vòng tròn để xem thông tin chi tiết</li>
              <li>• Kéo thả các vòng tròn, chúng sẽ tự động trở về vị trí ban đầu</li>
              <li>• Zoom in/out bằng cách cuộn chuột</li>
              <li>• Kích thước vòng tròn tỷ lệ thuận với số lượng người</li>
              <li>• Tỉnh có ít người hơn luôn hiển thị phía trên để dễ tương tác</li>
            </ul>
          </div>

          <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Thống kê số lượng người theo tỉnh thành
            </h3>
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 100,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                  <XAxis 
                    dataKey="shortName"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    axisLine={{ stroke: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Số người', angle: -90, position: 'insideLeft' }}
                    axisLine={{ stroke: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [value, 'Số người']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item ? item.province : label;
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      fontSize: '13px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};