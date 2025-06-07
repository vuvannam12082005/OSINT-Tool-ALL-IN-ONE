pipeline {
    agent any

    tools { nodejs 'Node18' }          // Đã khai báo trong Manage → Tools
    environment {
        SCANNER = tool 'SonarScanner'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Repo checked out"
            }
        }

        stage('Install web-tool deps') {
            when { fileExists('PROJECT1report/web-tool/package.json') }
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }

        stage('SonarQube full-repo scan') {
            steps {
                withSonarQubeEnv('SonarQube') {          // server đã gắn credential
                    script {
                        def key  = "osint-repo-${BUILD_NUMBER}"
                        def name = "OSINT repository build ${BUILD_NUMBER}"
                        def src  = 'PROJECT1report'      // quét cả cây bên dưới
                        def excl = '**/node_modules/**,**/venv/**,**/.git/**'

                        sh """
                        export SONAR_TOKEN=\$SONAR_AUTH_TOKEN       # <-- đặt env để scanner tự lấy
                        ${SCANNER}/bin/sonar-scanner               \
                          -Dsonar.projectKey=${key}                \
                          -Dsonar.projectName='${name}'            \
                          -Dsonar.projectBaseDir=.                 \
                          -Dsonar.sources=${src}                   \
                          -Dsonar.exclusions='${excl}'             \
                          -Dsonar.login=\$SONAR_AUTH_TOKEN         # <-- bảo đảm có token
                        """
                        echo "🔗 Report: http://127.0.0.1:9000/dashboard?id=${key}"
                    }
                }
            }
        }
    }

    post {
        success { echo "🎉 SUCCESS – full repo analysed." }
        failure { echo "❌ FAIL – xem Console Output để biết chi tiết." }
    }
}
