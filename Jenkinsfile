#!/usr/bin/env groovy

node {

    //Vars
    stage('checkout') {
        checkout scm
    }

    stage('printenv') {
        sh 'printenv'
    }

    stage('npm install') {
        sh 'npm install'
    }

}
