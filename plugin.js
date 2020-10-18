const httpSignature = require('http-signature')

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
        return 'application/json'
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

module.exports.templateTags = [
  {
    name: 'remoteit',
    displayName: 'remote.it API Authentication',
    description: 'remote.it API Authentication',
    args: [],
    async run(context) {
    }
  }
]

module.exports.requestHooks = [
  async (context) => {
    const request = context.request

    const keyId = request.getEnvironmentVariable('R3_ACCESS_KEY_ID')
    const key = Buffer.from(request.getEnvironmentVariable('R3_SECRET_ACCESS_KEY'), 'base64')

    const options = {
      key,
      keyId,
      algorithm: 'hmac-sha256',
      headers: '(request-target) host date content-type content-length'.split(' ')
    }

    httpSignature.sign(new RequestWrapper(request), options)
  }
]
