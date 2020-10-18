# Insomnia plugin for remote.it API authentication

This is a plugin for [Insomnia](https://insomnia.rest/) that allows the signing of HTTP Requests for [remote.it](https://remote.it/) API authentication.

##  Installation

Install the `insomnia-plugin-remoteit` plugin from Preferences -> Plugins.

##  How to use

Add the `remote.it API authentication` template tag as `Bearer token`.

The plugin will get your credentials from your _remote.it_ credentials file located at
`~/.remoteit/credentials`:

```ini
R3_ACCESS_KEY_ID=PV7BWOOSA34XBPHDYFFO
R3_SECRET_ACCESS_KEY=UZGhn/fqEYUPnhX6kZ3Z5uces3i0dq9YNw2+cOKh
```

Your credential file may contain multiple profiles:

```ini
[default]
R3_ACCESS_KEY_ID=PV7BWOOSA34XBPHDYFFO
R3_SECRET_ACCESS_KEY=UZGhn/fqEYUPnhX6kZ3Z5uces3i0dq9YNw2+cOKh
[test]
R3_ACCESS_KEY_ID=OYJKQK4O43MXYI7JHSUI
R3_SECRET_ACCESS_KEY=F/WCo0MH3uuyj1rYnXHDP+DqSIXkwKOpn/C0MbWa
```

Profile names are case-insensitive and the `default` profile will be selected by 
default. You can specify the profile for your environment using the `R3_PROFILE` 
Insomnia environment variable.

```json
{
  "R3_PROFILE": "test"
}
```

You can also specify your remote.it _Access Key ID_ and _Secret Access key_ directly 
in the Insomnia environment as:

```json
{
  "R3_ACCESS_KEY_ID": "PV7BWOOSA34XBPHDYFFO",
  "R3_SECRET_ACCESS_KEY": "UZGhn/fqEYUPnhX6kZ3Z5uces3i0dq9YNw2+cOKh"
}
```

This is not recommended as you can accidentally export your environment with your 
credentials.
