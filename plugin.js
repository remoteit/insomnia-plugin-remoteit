const fs = require('fs')
const ini = require('ini')
const os = require('os')
const path = require('path')
const httpSignature = require('http-signature')

const R3_ACCESS_KEY_ID = 'R3_ACCESS_KEY_ID'
const R3_SECRET_ACCESS_KEY = 'R3_SECRET_ACCESS_KEY'
const R3_PROFILE = 'R3_PROFILE'

const CREDENTIALS_FILE = '.remoteit/credentials'
const DEFAULT_PROFILE = 'default'

const SIGNATURE_ALGORITHM = 'hmac-sha256'
const SIGNED_HEADERS = '(request-target) host date content-type content-length'

const APPLICATION_JSON = 'application/json'

class RequestWrapper {
  constructor(request) {
    this.request = request
    this.url = new URL(request.getUrl())

    for (const parameter of request.getParameters()) {
      this.url.searchParams.append(parameter.name, parameter.value)
    }
  }

  get method() {
    return this.request.getMethod()
  }

  get path() {
    return `${this.url.pathname}${this.url.search}`
  }

  getHeader(name) {
    const result = this.request.getHeader(name)

    if (result) return result

    switch (name) {
      case 'host':
        return this.url.hostname
      case 'content-type':
        return APPLICATION_JSON
      case 'content-length':
        const body = this.request.getBody()

        return body.text.length
      default:
        return null
    }
  }

  setHeader(name, value) {
    this.request.setHeader(name, value)
  }
}

function getSection(object, name) {
  return object[Object.keys(object).find(key => key.toUpperCase() === name.toUpperCase())]
}

module.exports.templateTags = [
  {
    name: 'remoteit',
    displayName: 'remote.it API authentication',
    description: 'remote.it API authentication',
    args: [],
    async run(context) {
    }
  }
]

module.exports.requestHooks = [
  async (context) => {
    const request = context.request

    let keyId = request.getEnvironmentVariable(R3_ACCESS_KEY_ID)
    let key = request.getEnvironmentVariable(R3_SECRET_ACCESS_KEY)

    if (!keyId || !key) {
      const config = path.resolve(os.homedir(), CREDENTIALS_FILE)

      if (fs.existsSync(config)) {
        let credentials = ini.parse(fs.readFileSync(config, 'utf-8'))

        const profile = request.getEnvironmentVariable(R3_PROFILE)

        if (profile) {
          credentials = getSection(credentials, profile)

          if (!credentials) throw new Error(`remote.it profile ${profile} not found`)
        } else {
          credentials = getSection(credentials, DEFAULT_PROFILE) || credentials
        }

        keyId = credentials[R3_ACCESS_KEY_ID]
        key = credentials[R3_SECRET_ACCESS_KEY]
      }
    }

    if (!keyId || !key) throw new Error('no remote.it credentials')

    httpSignature.sign(new RequestWrapper(request), {
      keyId,
      key: Buffer.from(key, 'base64'),
      algorithm: SIGNATURE_ALGORITHM,
      headers: SIGNED_HEADERS.split(/\s+/)
    })
  }
]
