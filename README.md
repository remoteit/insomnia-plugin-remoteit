# Insomnia plugin for remote.it API authentication

This is a plugin for [Insomnia](https://insomnia.rest/) that allows the signing of HTTP Requests for [remote.it](https://remote.it/) API authentication.

##  Installation

Install the `insomnia-plugin-remoteit` plugin from Preferences -> Plugins.

##  How to use

In the query `Auth` tab, select `Bearer Token` and add the `remote.it API authentication`
template tag in the `TOKEN` field. 

The plugin will get your credentials from your _remote.it_ credentials file located at (the credentials below are non working examples, make sure to use your credentials)
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

You can specify the `remote.it Profile` you want to use on the template tag. Profile names
are case-insensitive and cannot contain a period.
 
The `default` profile will be selected by default. 
