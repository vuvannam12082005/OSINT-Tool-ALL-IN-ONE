let provideUse = [];

document.addEventListener('DOMContentLoaded', function() {
    const paths = document.querySelectorAll('svg path[id^="VN-"]');
    paths.forEach(path => {
        path.style.transition = 'transform 0.2s cubic-bezier(.4,2,.6,1), filter 0.2s, fill 0.2s';
        path.style.transformBox = 'fill-box';
        path.style.transformOrigin = 'center';
    });

    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('dataFile');
    const loadingIndicator = document.getElementById('loading');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
        }
    }
    
    function handleFiles(files) {
        if (files[0]) {
            loadingIndicator.style.display = 'block';
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    processData(jsonData);
                    
                    loadingIndicator.style.display = 'none';
                } catch (error) {
                    console.error('Error parsing JSON file:', error);
                    alert('Error parsing the file. Please make sure it\'s a valid JSON file.');
                    loadingIndicator.style.display = 'none';
                }
            };
            reader.readAsText(files[0]);
        }
    }
    
    fileInput.addEventListener('change', function(event) {
        loadingIndicator.style.display = 'block';
        handleFileSelect(event);
            
    });

    const mapContainer = document.getElementById('mapContainer');
    const svgElement = document.querySelector('.svg-container svg');
    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    
    document.getElementById('zoomIn').addEventListener('click', function() {
        if (scale < 3) {
            scale += 0.2;
            updateMapTransform();
        }
    });
    
    document.getElementById('zoomOut').addEventListener('click', function() {
        if (scale > 0.5) {
            scale -= 0.2;
            updateMapTransform();
        }
    });
    
    document.getElementById('resetView').addEventListener('click', function() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        updateMapTransform();
    });
    
    mapContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY;
        
        if (delta > 0) {
            if (scale > 0.5) scale -= 0.1;
        } else {
            if (scale < 3) scale += 0.1;
        }
        
        updateMapTransform();
    });
    
    mapContainer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        panning = true;
        startX = e.clientX - pointX;
        startY = e.clientY - pointY;
        mapContainer.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!panning) return;
        pointX = e.clientX - startX;
        pointY = e.clientY - startY;
        updateMapTransform();
    });
    
    document.addEventListener('mouseup', function() {
        panning = false;
        mapContainer.style.cursor = 'grab';
    });
    
    function updateMapTransform() {
        svgElement.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            loadingIndicator.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                processData(jsonData);
                loadingIndicator.style.display = 'none';
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error parsing the file. Please make sure it\'s a valid JSON file.');
                loadingIndicator.style.display = 'none';
            }
        };
        reader.readAsText(file);
    }

    function processData(jsonData) {
        const paths = document.querySelectorAll('svg path[id^="VN-"]');
        paths.forEach(path => {
            path.setAttribute('fill', '#2196F3');
        });

        const provinceMap = {};
        const users = getAllUsers(jsonData.tree_data || jsonData);

        users.forEach(user => {
            let provinces = [];
            if (user.about_info && user.about_info.about && user.about_info.about.content && user.about_info.about.content.general) {
                user.about_info.about.content.general.forEach(line => {
                    if (line.startsWith("Sống tại")) {
                        let p = line.replace("Sống tại", "").replace(/\n/g, "").trim();
                        if (p) provinces.push(p);
                    }
                    if (line.startsWith("Đến từ")) {
                        let p = line.replace("Đến từ", "").replace(/\n/g, "").trim();
                        if (p) provinces.push(p);
                    }
                });
            }
            if (user.about_info && user.about_info.about_places && user.about_info.about_places.content && user.about_info.about_places.content.general) {
                user.about_info.about_places.content.general.forEach(line => {
                    if (line !== "Nơi từng sống" && line.trim() !== "" && !/hiển thị$/.test(line)) {
                        provinces.push(line.replace(/\n/g, "").trim());
                    }
                });
            }
            provinces.forEach(province => {
                if (!provinceMap[province]) provinceMap[province] = [];
                provinceMap[province].push(user);
            });
        });

        paths.forEach(path => {
            const provinceName = path.getAttribute('title');
            const usersInProvince = provinceMap[provinceName] || [];
            const nameSet = new Set();
            usersInProvince.forEach(u => {
                let name = (u.about_info && u.about_info.about && u.about_info.about.title) ? u.about_info.about.title : (u.username || u.id);
                nameSet.add(name);
            });
            if (nameSet.size > 0) {
                path.setAttribute('fill', '#e91e63');
            }
        });

        setupHoverEffects(paths, provinceMap);
        updateBarChart(provinceMap);
    }

    function setupHoverEffects(paths, provinceMap) {
        const tooltip = document.querySelector('.tooltip-fixed') || createTooltip();

        paths.forEach(path => {
            let isHovered = false;
            let originalFill = path.getAttribute('fill');
            
            path.addEventListener('mouseenter', function(e) {
                if (isHovered) return;
                isHovered = true;
                this.parentNode.appendChild(this);
                this.style.transform = 'scale(1.5)';
                this.style.filter = 'drop-shadow(0 0 8px #1976d2)';
                this.setAttribute('fill', '#FF9800');
                
                const provinceName = this.getAttribute('title');
                const usersInProvince = provinceMap[provinceName] || [];
                let html = `<b>${provinceName}</b><br>`;
                provideUse.push(provinceName);
                const nameSet = new Set();
                usersInProvince.forEach(u => {
                    let name = (u.about_info && u.about_info.about && u.about_info.about.title) ? u.about_info.about.title : (u.username || u.id);
                    nameSet.add(name);
                });
                html += `Số người: <b>${nameSet.size}</b>`;
                if (nameSet.size > 0) {
                    html += '<ul style="margin:4px 0 0 16px;padding:0">';
                    nameSet.forEach(name => {
                        html += `<li>${name}</li>`;
                    });
                    html += '</ul>';
                }
                tooltip.innerHTML = html;
                tooltip.style.display = 'block';
            });

            path.addEventListener('mousemove', function(e) {
                tooltip.style.left = (e.clientX + 12) + 'px';
                tooltip.style.top = (e.clientY + 12) + 'px';
            });

            path.addEventListener('mouseleave', function() {
                isHovered = false;
                this.style.transform = '';
                this.style.filter = '';
                const provinceName = this.getAttribute('title');
                const usersInProvince = provinceMap[provinceName] || [];
                const nameSet = new Set();
                usersInProvince.forEach(u => {
                    let name = (u.about_info && u.about_info.about && u.about_info.about.title) ? u.about_info.about.title : (u.username || u.id);
                    nameSet.add(name);
                });
                if (nameSet.size > 0) {
                    this.setAttribute('fill', '#e91e63');
                } else {
                    this.setAttribute('fill', originalFill);
                }
                tooltip.style.display = 'none';
            });
        });
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-fixed';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function getAllUsers(tree, users = []) {
        users.push(tree);
        if (tree.children && tree.children.length) {
            tree.children.forEach(child => getAllUsers(child, users));
        }
        return users;
    }

    function updateBarChart(provinceMap) {
        const chartElement = document.getElementById('provinceChart');
        const canvas = document.getElementById('myChart');
        
        if (window.myBarChart) {
            window.myBarChart.destroy();
        }
        
        const paths = document.querySelectorAll('svg path[id^="VN-"]');
        const provinceData = [];
        
        paths.forEach(path => {
            const provinceName = path.getAttribute('title');
            const usersInProvince = provinceMap[provinceName] || [];
            
            const nameSet = new Set();
            usersInProvince.forEach(u => {
                let name = (u.about_info && u.about_info.about && u.about_info.about.title) 
                    ? u.about_info.about.title 
                    : (u.username || u.id);
                nameSet.add(name);
            });
            
            if (nameSet.size > 0) {
                provinceData.push({
                    province: provinceName,
                    count: nameSet.size
                });
            }
        });
        
        provinceData.sort((a, b) => b.count - a.count);
        
        if (provinceData.length === 0) {
            chartElement.innerHTML = '<div class="no-data">Không có dữ liệu để hiển thị</div>';
            return;
        }
        
        const labels = provinceData.map(item => item.province);
        const data = provinceData.map(item => item.count);
        
        const backgroundColors = provinceData.map(() => '#e91e63');
        
        window.myBarChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số người',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Số người: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Số người'
                        }
                    }
                }
            }
        });
        
        chartElement.style.height = '500px';
    }
});

