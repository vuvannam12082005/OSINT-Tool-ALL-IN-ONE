environment {
    GITHUB_TOKEN = credentials('github-token-osint')
}

stages {
    stage('Checkout') {
        steps {
            checkout([
                $class: 'GitSCM',
                branches: [[name: '*/main']],
                userRemoteConfigs: [[
                    url: 'https://github.com/vuvannam12082005/OSINT-Tool-ALL-IN-ONE.git',
                    credentialsId: 'github-token-osint'
                ]]
            ])
        }
    }
}
