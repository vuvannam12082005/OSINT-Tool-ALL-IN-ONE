pipeline {
    agent any

    tools { nodejs 'Node18' }

    environment {
        SCANNER = tool 'SonarScanner'
        SONAR_HOST_URL = 'http://sonarqube:9000'
        SONAR_LOGIN    = 'sqp_77195ebf26ec7e3a5541263f1bbb74fdea9a4bb5'
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        stage('Install deps') {
            steps {
                dir('PROJECT1report/web-tool') {
                    sh 'npm ci --loglevel=error'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                    ${SCANNER}/bin/sonar-scanner \
                      -Dsonar.projectKey=osint-web-tool \
                      -Dsonar.projectBaseDir=PROJECT1report/web-tool \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/** \
                      -Dsonar.host.url=$SONAR_HOST_URL \
                      -Dsonar.login=$SONAR_LOGIN
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true   // report-task.txt nay nằm ở gốc, nên OK
                }
            }
        }
    }
}
