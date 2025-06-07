pipeline {
    agent any                // giữ nguyên

    tools {
        nodejs 'Node18'      // đúng với Name bạn vừa tạo
    }

    environment {
        SCANNER = tool 'SonarScanner'
    }

    stages {
        stage('Checkout')        { steps { checkout scm } }

        stage('Install deps') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('PROJECT1report/web-tool') {
                    withSonarQubeEnv('SonarQube') {
                        sh """
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=osint-web-tool \
                          -Dsonar.sources=src \
                          -Dsonar.exclusions=node_modules/**
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
