import {URL} from 'url'
import * as core from '@actions/core'

export interface Repository {
  name: string
  url: string
}

export interface Vulnerability {
  Target: string
  Vulnerabilities: CVE[] | null
}

export interface CVE {
  VulnerabilityID: string
  PkgName: string
  InstalledVersion: string
  FixedVersion: string
  Severity: string
}

export interface Build {
  repository?: string
  workflow?: string
  commitSHA?: string
  runID?: string
}

export class BuildAction {
  repository?: string
  workflow?: string
  commitSHA?: string
  runID?: string
  private githubURL: URL = new URL('https://github.com/')
  constructor(build: Build) {
    core.debug('constructor')
    core.debug(this.githubURL.href)
    this.repository = build.repository
    this.workflow = build.workflow
    this.commitSHA = build.commitSHA
    this.runID = build.runID
  }

  get runURL(): URL {
    core.debug('get runURL')
    core.debug(new URL('https://github.com/').href)
    core.debug(this.githubURL.href)
    this.githubURL.pathname = `/${this.repository}/actions/runs/${this.runID}`
    return this.githubURL
  }

  get githubRepositoryURL(): URL {
    this.githubURL.pathname = `/${this.repository}`
    return this.githubURL
  }
}
