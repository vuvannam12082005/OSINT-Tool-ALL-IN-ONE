pipeline {
    agent any
    
    tools { 
        nodejs 'Node18' 
    }
    
    environment {
        SCANNER = tool 'SonarScanner'
    }
    
    stages {
        stage('Checkout') {
            steps { 
                checkout scm 
            }
        }
        
        stage('Discover Repository Structure') {
            steps {
                script {
                    // Liệt kê thư mục để debug
                    sh 'find . -maxdepth 2 -type d | head -20'
                    
                    // Kiểm tra thư mục nào tồn tại
                    env.HAS_PROJECT1REPORT = fileExists('PROJECT1report') ? 'true' : 'false'
                    env.HAS_CRAWL_ALL = fileExists('crawl-all') ? 'true' : 'false'
                    env.HAS_SRC = fileExists('src') ? 'true' : 'false'
                    
                    echo "📁 Found directories:"
                    echo "   PROJECT1report: ${env.HAS_PROJECT1REPORT}"
                    echo "   crawl-all: ${env.HAS_CRAWL_ALL}"  
                    echo "   src: ${env.HAS_SRC}"
                }
            }
        }
        
        stage('Install web-tool deps') {
            when { 
                expression { env.HAS_PROJECT1REPORT == 'true' && fileExists('PROJECT1report/web-tool/package.json') }
            }
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }
        
        stage('Sonar Analysis - Adaptive') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        // Xây dựng danh sách sources dựa trên thư mục có sẵn
                        def sources = []
                        def excludePatterns = [
                            '**/node_modules/**',
                            '**/venv/**', 
                            '**/.git/**',
                            '**/__pycache__/**',
                            '**/dist/**',
                            '**/build/**',
                            '**/.scannerwork/**',
                            '**/*.min.js',
                            '**/*.map'
                        ]
                        
                        if (env.HAS_PROJECT1REPORT == 'true') {
                            sources.add('PROJECT1report')
                        }
                        if (env.HAS_CRAWL_ALL == 'true') {
                            sources.add('crawl-all')
                        }
                        if (env.HAS_SRC == 'true') {
                            sources.add('src')
                        }
                        
                        // Fallback nếu không tìm thấy thư mục nào
                        if (sources.isEmpty()) {
                            sources.add('.')
                            excludePatterns.addAll(['**/.*/**', '**/Jenkinsfile', '**/README.md'])
                        }
                        
                        def sourcesStr = sources.join(',')
                        def exclusionsStr = excludePatterns.join(',')
                        
                        echo "🎯 Scanning sources: ${sourcesStr}"
                        echo "🚫 Excluding: ${exclusionsStr}"
                        
                        sh """
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=osint-tool-full \
                          -Dsonar.projectName="OSINT Tool - Full Repository" \
                          -Dsonar.projectBaseDir=. \
                          -Dsonar.sources=${sourcesStr} \
                          -Dsonar.exclusions='${exclusionsStr}' \
                          -Dsonar.python.coverage.reportPaths='**/coverage.xml' \
                          -Dsonar.javascript.lcov.reportPaths='**/coverage/lcov.info'
                        """
                    }
                    
                    echo "✅ Adaptive repository analysis completed!"
                    echo "📊 View report: http://127.0.0.1:9000/dashboard?id=osint-tool-full"
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Full repository scan completed successfully!"
            echo "📊 SonarQube Report: http://127.0.0.1:9000/dashboard?id=osint-tool-full"
        }
        failure {
            echo "❌ Pipeline failed. Check 'Discover Repository Structure' stage for actual folder structure."
        }
    }
}
