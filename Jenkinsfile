pipeline {
    agent any

    /* tool NodeJS 18.x bạn đã thêm */
    tools { nodejs 'Node18' }

    /* SCANNER chỉ lấy đường dẫn từ Tools */
    environment {
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

        stage('Sonar Analysis & Quality Gate') {
            steps {
                /* Wrapper tự đặt SONAR_AUTH_TOKEN và SONAR_HOST_URL */
                withSonarQubeEnv('SonarQube') {
                    /* -------------- PHÂN TÍCH -------------- */
                    sh """
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-web-tool \
                      -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/** \
                      -Dsonar.login=\${SONAR_AUTH_TOKEN}
                    """

                    /* -------------- CHỜ GATE -------------- */
                    timeout(time: 10, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
    }
}
