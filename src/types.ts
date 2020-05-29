export interface Repository {
  name: string
  url: string
}

export interface VulnerabilityIssue {
  level: string
  name: string
  cve: string
}
