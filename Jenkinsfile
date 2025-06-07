pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        SCANNER = tool 'SonarScanner'
    }

    stages {

        /*-- 1. Lấy code --*/
        stage('Checkout') {
            steps {
                checkout scm
                echo '✅ Repo checked out'
            }
        }

        /*-- 2. Debug nhanh --*/
        stage('Debug Info') {
            steps {
                sh 'pwd'
                sh 'ls -la | head'
            }
        }

        /*-- 3. Cài npm nếu package.json tồn tại --*/
        stage('Install Dependencies') {
            when {
                expression { fileExists('PROJECT1report/web-tool/package.json') }
            }
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
                echo '✅ NPM dependencies installed'
            }
        }

        /*-- 4. SonarQube toàn repo --*/
        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def key   = "osint-repo-${env.BUILD_NUMBER}"
                        def name  = "OSINT Repository Build ${env.BUILD_NUMBER}"
                        def src   = 'PROJECT1report'
                        def excl  = '**/node_modules/**,**/venv/**,**/.git/**'

                        sh """
                        export SONAR_TOKEN=\$SONAR_AUTH_TOKEN
                        ${SCANNER}/bin/sonar-scanner \
                          -Dsonar.projectKey=${key} \
                          -Dsonar.projectName='${name}' \
                          -Dsonar.projectBaseDir=. \
                          -Dsonar.sources=${src} \
                          -Dsonar.exclusions='${excl}' \
                          -Dsonar.login=\$SONAR_AUTH_TOKEN
                        """
                        echo "🔗 Report: http://127.0.0.1:9000/dashboard?id=${key}"
                    }
                }
            }
        }
    }

    post {
        success { echo '🎉 SUCCESS – full repo analysed.' }
        failure { echo '❌ FAILED – xem Console Output.' }
    }
}
