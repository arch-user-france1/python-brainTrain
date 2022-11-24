function bfetch(URL, method, body) {
  const data = new Object()
  data['method'] = method,
  data['cache'] = 'no-cache'

  if (method != "GET" && method != "HEAD"){
    data['headers'] = {'Content-Type': 'application/json'},
    data['body'] = body
  }

  return fetch(URL,data)
}
