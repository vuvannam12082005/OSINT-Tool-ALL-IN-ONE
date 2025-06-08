/*  Jenkinsfile  –  quét toàn bộ repo, bỏ node_modules + venv, tăng heap 2 GB  */

pipeline {
    agent any

    /* Tool đã khai trong Manage Jenkins → Tools */
    tools {
        nodejs 'Node18'
    }

    environment {
        SCANNER = tool 'SonarScanner'          // đường dẫn CLI
        SONAR_SCANNER_OPTS = "-Xmx2g"          // tăng heap để tránh OOM
    }

    stages {

        /* 1️⃣ Lấy mã nguồn */
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        /* 2️⃣ Cài npm nếu có package.json ở gốc repo */
        stage('Install deps') {
            when { expression { fileExists('package.json') } }
            steps {
                sh 'npm ci --ignore-scripts --loglevel=error'
            }
        }

        /* 3️⃣ Phân tích SonarQube */
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {      // server đã gán credential sonar-token
                    sh """
                        export SONAR_TOKEN=\$SONAR_AUTH_TOKEN
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=${env.JOB_BASE_NAME} \
                          -Dsonar.sources=. \
                          -Dsonar.exclusions='**/node_modules/**,**/venv/**,**/.git/**,**/PROJECT1report/**/venv/**' \
                          -Dsonar.login=\$SONAR_AUTH_TOKEN
                    """
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Scan done! Check SonarQube dashboard.'
        }
        failure {
            echo '❌ Scan failed – xem Console Output để biết chi tiết.'
        }
    }
}
