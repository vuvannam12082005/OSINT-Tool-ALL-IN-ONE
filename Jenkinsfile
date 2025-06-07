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
        
        stage('Install web-tool deps') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }
        
        stage('Install Python deps (optional)') {
            steps {
                script {
                    if (fileExists('crawl-all/new2/requirements.txt')) {
                        dir('crawl-all/new2') {
                            sh '''
                                python3 -m venv venv || true
                                . venv/bin/activate || true
                                pip install -r requirements.txt || true
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Sonar Analysis - Full Repo') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-tool-full \
                      -Dsonar.projectName="OSINT Tool - Full Repository" \
                      -Dsonar.projectBaseDir=. \
                      -Dsonar.sources=PROJECT1report,crawl-all \
                      -Dsonar.exclusions='**/node_modules/**,**/venv/**,**/.git/**,**/__pycache__/**,**/dist/**,**/build/**,**/.scannerwork/**,**/*.min.js,**/*.map' \
                      -Dsonar.python.coverage.reportPaths='**/coverage.xml' \
                      -Dsonar.javascript.lcov.reportPaths='**/coverage/lcov.info'
                    """
                    
                    echo "✅ Full repository analysis completed!"
                    echo "📊 View report: http://127.0.0.1:9000/dashboard?id=osint-tool-full"
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Full repository scan completed successfully!"
            echo "📊 SonarQube Report: http://127.0.0.1:9000/dashboard?id=osint-tool-full"
            echo "🔍 Analyzed: TypeScript/React + Python + HTML + Config files"
        }
        failure {
            echo "❌ Pipeline failed. Check logs above."
        }
    }
}
