// Jenkinsfile – CI/CD hoàn chỉnh cho OSINT Web Tool
pipeline {

    /* 1) Chạy trên bất kỳ agent của Jenkins controller */
    agent any

    /* 2) Khai báo các tool cần thiết */
    tools {
        nodejs 'Node18'            // Tên NodeJS đã tạo trong Manage Jenkins → Tools
    }

    /* 3) Biến môi trường cục bộ */
    environment {
        SCANNER = tool 'SonarScanner'   // SonarScanner đã thêm ở Tools
    }

    stages {

        /*-----------------------------------*/
        stage('Checkout') {
            steps { checkout scm }
        }

        /*-----------------------------------*/
        stage('Install dependencies') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }

        /*-----------------------------------*/
        stage('SonarQube Analysis & Quality Gate') {
            /*  Sử dụng wrapper withSonarQubeEnv – 
                Jenkins tự inject: SONAR_HOST_URL, SONAR_AUTH_TOKEN   */
            steps {
                withSonarQubeEnv('SonarQube') {     // “SonarQube” = Name server ở phần System
                    /* 3.1 Chạy sonar-scanner
                       -Dsonar.projectBaseDir trỏ về thư mục web-tool       */
                    sh """
                       ${SCANNER}/bin/sonar-scanner \
                         -Dsonar.projectKey=osint-web-tool \
                         -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                         -Dsonar.sources=src \
                         -Dsonar.exclusions=node_modules/**
                    """

                    /* 3.2 Đợi kết quả Quality Gate (tối đa 10 phút)        */
                    timeout(time: 10, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
    }

    /* 4) Tùy chọn – lưu artifact hoặc gửi thông báo khi thành công
       post {
           success { … }
           failure { … }
       }
    */
}
