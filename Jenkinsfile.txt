pipeline {
    agent any

    environment {
        // tên scanner đúng như bước 1
        SCANNER = tool 'SonarScanner'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install dependencies') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('PROJECT1report/web-tool') {
                    withSonarQubeEnv('SonarQube') {   // "SonarQube" đúng Name server đã khai báo
                        sh """
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=osint-web-tool \
                          -Dsonar.sources=src \
                          -Dsonar.exclusions=node_modules/** \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
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