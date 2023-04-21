const fs = require('fs')
const ini = require('ini')
const os = require('os')
const path = require('path')
const httpSignature = require('http-signature')

const R3_ACCESS_KEY_ID = 'R3_ACCESS_KEY_ID'
const R3_SECRET_ACCESS_KEY = 'R3_SECRET_ACCESS_KEY'

const CREDENTIALS_FILE = '.remoteit/credentials'
const DEFAULT_PROFILE = 'default'

const SIGNATURE_ALGORITHM = 'hmac-sha256'
const SIGNED_HEADERS = '(request-target) host date content-type content-length'

const APPLICATION_JSON = 'application/json'

class RequestWrapper {
  constructor (request) {
    this.request = request

    const url = request.getUrl()

    if (!url) throw new Error('No URL specified')

    try {
      this.url = new URL(url)
    } catch (error) {
      throw new Error(`Invalid URL specified: ${url}`)
    }

    for (const parameter of request.getParameters()) {
      this.url.searchParams.append(parameter.name, parameter.value)
    }
  }

  get method () {
    return this.request.getMethod()
  }

  get path () {
    return `${this.url.pathname}${this.url.search}`
  }

  getHeader (name) {
    const result = this.request.getHeader(name)

    if (result) return result

    switch (name) {
      case 'host':
        return this.url.hostname
      case 'content-type':
        return APPLICATION_JSON
      case 'content-length':
        const body = this.request.getBody()

        return Buffer.byteLength(body.text, 'utf8')
      default:
        return null
    }
  }

  setHeader (name, value) {
    this.request.setHeader(name, value)
  }
}

function getSection (object, name) {
  return object[Object.keys(object).find(key => key.toUpperCase() === name.toUpperCase())]
}

module.exports.templateTags = [{
  name: 'remoteit',
  displayName: 'remote.it API authentication',
  description: 'use your remote.it credentials to authorize your requests',
  args: [{
    displayName: 'remote.it Profile', type: 'string', placeholder: 'default'
  }],
  async run (context, profile) {
    const file = path.resolve(os.homedir(), CREDENTIALS_FILE)

    if (!fs.existsSync(file)) return `remote.it credentials file not found: ${file}`

    let credentials

    try {
      credentials = ini.parse(fs.readFileSync(file, 'utf-8'))
    } catch (error) {
      return `remote.it credentials file error: ${error.message}`
    }

    if (profile) {
      credentials = getSection(credentials, profile)

      if (!credentials) return `remote.it profile not found: ${profile}`
    } else {
      credentials = getSection(credentials, DEFAULT_PROFILE) || credentials
    }

    const key = credentials[R3_ACCESS_KEY_ID]

    if (!key) return `remote.it credentials missing: ${R3_ACCESS_KEY_ID}`

    const secret = credentials[R3_SECRET_ACCESS_KEY]

    if (!secret) return `remote.it credentials missing: ${R3_SECRET_ACCESS_KEY}`

    await Promise.all([context.store.setItem(R3_ACCESS_KEY_ID, key), context.store.setItem(R3_SECRET_ACCESS_KEY, secret)])

    return `using key: ${key}`
  }
}]

module.exports.requestHooks = [async (context) => {
  const [key, secret] = await Promise.all([context.store.getItem(R3_ACCESS_KEY_ID), context.store.getItem(R3_SECRET_ACCESS_KEY)])

  if (!key || !secret) return // missing credentials

  httpSignature.sign(new RequestWrapper(context.request), {
    keyId: key, key: Buffer.from(secret, 'base64'), algorithm: SIGNATURE_ALGORITHM, headers: SIGNED_HEADERS.split(/\s+/)
  })

  await context.store.clear() // clear after use
}]
