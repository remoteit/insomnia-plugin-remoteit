const fs = require('fs')
const ini = require('ini')
const os = require('os')
const path = require('path')
const {default: {signMessage}, createSigner} = require('http-message-signatures')

const R3_ACCESS_KEY_ID = 'R3_ACCESS_KEY_ID'
const R3_SECRET_ACCESS_KEY = 'R3_SECRET_ACCESS_KEY'

const CREDENTIALS_FILE = '.remoteit/credentials'
const DEFAULT_PROFILE = 'DEFAULT'

const SIGNATURE_ALGORITHM = 'hmac-sha256'
const SIGNED_HEADERS = ['@method', '@authority', '@target-uri', 'date']

function wrap (request) {
  const url = new URL(request.getUrl())

  for (const {name, value} of request.getParameters()) url.searchParams.append(name, value)

  const headers = request.getHeaders().reduce((result, {name, value}) => {
    result[name] = value
    return result
  }, {})

  headers['Host'] = url.hostname
  headers['Date'] ||= new Date().toUTCString()

  return {
    method: request.getMethod(),
    url,
    headers
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

module.exports.requestHooks = [
  async ({store, request}) => {
    const [key, secret] = await Promise.all([
      store.getItem(R3_ACCESS_KEY_ID),
      store.getItem(R3_SECRET_ACCESS_KEY)
    ])

    if (!key || !secret) return

    const {headers} = await signMessage(
      {
        key: createSigner(Buffer.from(secret, 'base64'), SIGNATURE_ALGORITHM, key),
        name: 'remoteit',
        fields: SIGNED_HEADERS
      },
      wrap(request)
    )

    Object.entries(headers).forEach(([name, value]) => request.setHeader(name, value))

    request.setHeader('Authorization', '')

    await store.clear()
  }
]
