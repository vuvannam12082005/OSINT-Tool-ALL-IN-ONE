pipeline {
    agent any                               // chạy trên controller

    tools {
        nodejs 'Node18'                     // npm cho dự án JS/TS
    }

    environment {
        SCANNER = tool 'SonarScanner'       // đường dẫn CLI
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Repo checked out @ ${GIT_COMMIT}"
            }
        }

        /* Nếu dự án có npm – cài dependences (bỏ qua nếu không tồn tại) */
        stage('Install NPM deps') {
            when { expression { fileExists('package.json') } }
            steps { sh 'npm ci --ignore-scripts --loglevel=error' }
        }

        stage('SonarQube – Full repo scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def key  = "repo-${env.GIT_COMMIT.take(8)}"
                        def name = "Full-scan ${env.BUILD_NUMBER}"

                        sh """
                        export SONAR_TOKEN=$SONAR_AUTH_TOKEN
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=${key} \
                          -Dsonar.projectName='${name}' \
                          -Dsonar.sources=. \
                          -Dsonar.exclusions='**/node_modules/**,**/venv/**,**/.git/**,**/dist/**,**/build/**' \
                          -Dsonar.login=$SONAR_AUTH_TOKEN
                        """
                        echo "🔗 Report: http://127.0.0.1:9000/dashboard?id=${key}"
                    }
                }
            }
        }
    }

    post {
        success { echo '🎉 CI scan completed SUCCESSFULLY' }
        failure { echo '❌ CI scan FAILED – xem Console Output.' }
    }
}
