/*  Jenkinsfile  –  quét toàn bộ repository  */
pipeline {
    agent any                     // dùng executor mặc định trên controller

    /************* TOOLS *************/
    tools {                       // tên phải trùng Manage → Tools
        nodejs 'Node18'           // Node + npm
    }

    /************* ENV **************/
    environment {
        SCANNER = tool 'SonarScanner'   // Đường dẫn CLI
    }

    /************* STAGES ************/
    stages {

        /* 1. Lấy code */
        stage('Checkout') {
            steps {
                checkout scm
                echo '✅ Repository checked out'
            }
        }

        /* 2. Debug nhanh cấu trúc repo */
        stage('Debug Info') {
            steps {
                sh 'pwd'
                sh 'ls -la | head'
                sh 'find . -maxdepth 2 -type d | head'
            }
        }

        /* 3. Cài npm cho web-tool (nếu có) */
        stage('Install Dependencies') {
            when { fileExists('PROJECT1report/web-tool/package.json') }
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
                echo '✅ NPM dependencies installed'
            }
        }

        /* 4. Phân tích SonarQube cho TOÀN BỘ repo */
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {

                    script {
                        /* --- cấu hình linh hoạt --- */
                        def projectKey  = "osint-repo-${env.BUILD_NUMBER}"
                        def projectName = "OSINT Repository Build ${env.BUILD_NUMBER}"
                        def sources     = 'PROJECT1report'     // quét cả cây dưới
                        def exclusions  = '**/node_modules/**,' +
                                          '**/venv/**,'        +
                                          '**/.git/**,'        +
                                          '**/__pycache__/**,' +
                                          '**/dist/**,**/build/**,' +
                                          '**/.scannerwork/**,' +
                                          '**/*.min.js,**/*.map'

                        echo "🔑 ProjectKey : ${projectKey}"
                        echo "📂 Sources     : ${sources}"

                        /* --- chạy sonar-scanner --- */
                        sh """
                        export SONAR_TOKEN=\$SONAR_AUTH_TOKEN
                        ${SCANNER}/bin/sonar-scanner \\
                          -Dsonar.projectKey=${projectKey} \\
                          -Dsonar.projectName='${projectName}' \\
                          -Dsonar.projectBaseDir=. \\
                          -Dsonar.sources=${sources} \\
                          -Dsonar.exclusions='${exclusions}' \\
                          -Dsonar.login=\$SONAR_AUTH_TOKEN
                        """
                    }
                }
            }
        }
    }

    /************* POST **************/
    post {
        success {
            echo '🎉 SUCCESS – kiểm tra báo cáo tại SonarQube.'
        }
        failure {
            echo '❌ BUILD FAILED – mở Console Output để xem chi tiết.'
        }
    }
}
