const {get_server, return_peers} = require('./server')


const {start, server} = get_server(1111)

peers = []
function handle(req, res, next) {
	console.log(req.query)
	their_port = req.query.port
	peers.push(their_port)
	res.send({
    peers: peers
  })
}
server.get('/peers', handle)
start()




