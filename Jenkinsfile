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
        
        stage('Sonar') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    echo "SONAR_AUTH_TOKEN = \$SONAR_AUTH_TOKEN"
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-web-tool \
                      -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/**
                    """
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
