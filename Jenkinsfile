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
        
        stage('Install deps') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }
        
        stage('Sonar Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-web-tool \
                      -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/**
                    """
                    
                    // Hiển thị link để xem báo cáo
                    echo "✅ Analysis completed! View report at: http://127.0.0.1:9000/dashboard?id=osint-web-tool"
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Pipeline completed successfully!"
            echo "📊 Check SonarQube report: http://127.0.0.1:9000/dashboard?id=osint-web-tool"
        }
    }
}
