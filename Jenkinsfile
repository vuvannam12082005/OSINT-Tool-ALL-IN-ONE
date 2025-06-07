pipeline {
    agent any
    
    tools { nodejs 'Node18' }
    
    environment {
        SCANNER = tool 'SonarScanner'
    }
    
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        
        stage('Install deps') {
            when { fileExists('PROJECT1report/web-tool/package.json') }
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }
        
        stage('Full Repo Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-repo-${BUILD_NUMBER} \
                      -Dsonar.projectName="OSINT Repository - Build ${BUILD_NUMBER}" \
                      -Dsonar.projectBaseDir=. \
                      -Dsonar.sources=PROJECT1report \
                      -Dsonar.exclusions='**/node_modules/**,**/venv/**,**/.git/**,**/__pycache__/**,**/*.min.js'
                    """
                    
                    echo "✅ Full repository scan completed!"
                    echo "📊 Project: osint-repo-${BUILD_NUMBER}"
                    echo "🔗 URL: http://127.0.0.1:9000/dashboard?id=osint-repo-${BUILD_NUMBER}"
                }
            }
        }
    }
}
