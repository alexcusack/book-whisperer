const {get_server, return_peers} = require('./server')


const {start, server} = get_server(1111)
server.get('/peers', return_peers({peers: [88]}))
start()




