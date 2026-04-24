import type { OpenNextConfig } from '@opennextjs/cloudflare'

const config: OpenNextConfig = {
  buildCommand: 'npm run build',
  devCommand: 'npm run dev',
  nodeVersion: '20.x',
  skipInstall: false,
  buildOptions: {
    outputDir: '.next',
  logLevel: 'info'
  }
}

export default config
