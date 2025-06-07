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
                echo "✅ Repository checked out successfully"
            }
        }
        
        stage('Debug Info') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'find . -name "*.js" -o -name "*.py" -o -name "*.ts" | head -10'
                echo "Build number: ${BUILD_NUMBER}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    if (fileExists('PROJECT1report/web-tool/package.json')) {
                        dir('PROJECT1report/web-tool') {
                            sh 'npm ci --loglevel=error'
                        }
                        echo "✅ NPM dependencies installed"
                    } else {
                        echo "⚠️ No package.json found, skipping npm install"
                    }
                }
            }
        }
        
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def projectKey = "osint-repo-${BUILD_NUMBER}"
                        def projectName = "OSINT Repository Build ${BUILD_NUMBER}"
                        
                        echo "🎯 Starting SonarQube analysis..."
                        echo "📁 Project Key: ${projectKey}"
                        
                        sh """
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=${projectKey} \
                          -Dsonar.projectName="${projectName}" \
                          -Dsonar.sources=PROJECT1report \
                          -Dsonar.exclusions='**/node_modules/**,**/venv/**,**/.git/**'
                        """
                        
                        echo "✅ SonarQube analysis completed!"
                        echo "🔗 View at: http://127.0.0.1:9000/dashboard?id=${projectKey}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "📊 Pipeline completed. Check Console Output for details."
        }
        success {
            echo "🎉 SUCCESS! SonarQube report ready."
        }
        failure {
            echo "❌ FAILED! Check logs above for errors."
        }
    }
}
