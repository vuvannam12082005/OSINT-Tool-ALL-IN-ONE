pipeline {
    agent any

    tools { nodejs 'Node18' }          // tên NodeJS trong Tools

    environment {
        SCANNER = tool 'SonarScanner'  // SonarScanner trong Tools
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

        stage('SonarQube Analysis & Quality Gate') {
            steps {
                withSonarQubeEnv('SonarQube') {            // Name = SonarQube trong System
                    sh """
                       ${SCANNER}/bin/sonar-scanner \
                         -Dsonar.projectKey=osint-web-tool \
                         -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                         -Dsonar.sources=src \
                         -Dsonar.exclusions=node_modules/** \
                         -Dsonar.login=$SONAR_AUTH_TOKEN    // <-- quan trọng
                    """

                    timeout(time: 10, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }
    }
}
