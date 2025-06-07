pipeline {
    agent any
    tools {                         // lấy tool đã khai
        nodejs 'Node18'
    }
    environment {
        SCANNER = tool 'SonarScanner'
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        // (Tuỳ dự án có package.json hay không)
        stage('Install deps') {
            when { expression { fileExists('package.json') } }
            steps { sh 'npm ci --loglevel=error' }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    export SONAR_TOKEN=\$SONAR_AUTH_TOKEN
                    ${SCANNER}/bin/sonar-scanner \\
                      -Dsonar.projectKey=${env.JOB_BASE_NAME} \\
                      -Dsonar.sources=. \\
                      -Dsonar.exclusions=**/node_modules/**,**/.git/**
                    """
                }
            }
        }
    }
    post {
        success { echo '🎉 Scan done! Check SonarQube dashboard.' }
    }
}
