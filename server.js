const restify = require('restify');
const bunyan = require('bunyan');
const log = bunyan.createLogger({
  name: "server",
  pid: `port=${process.env.PORT}`
});
 
function ping(req, res, next) {
  const timestamp = new Date().toISOString();
  const memMB = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
  res.send({
    pong: timestamp,
    memMB: memMB
  });
  return next();
}

function return_peers(state) {
  return (req, res, net) => {
    res.send({
      peers: Array.from(state.peers)
    })
  }
}

function handle_gossip(state, handler) {
  return (req, res, next) => {
    log.debug('handling gossip', req.body)
    handler(state, req.body)
    res.send({status: 'ok'})
  }
}

function get_server(port) {
  const server = restify.createServer({
    name: 'gossip',
    version: '1.0.0',
    log: log
  });

  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.bodyParser());
  server.use(restify.plugins.requestLogger());

  server.pre(function(req, res, next) {
      server.log.debug({params: req.params}, 'processing request');
      next();
  });

  server.get('/ping', ping)
  const start = () => {
    log.info('starting up', {port: process.env.PORT || port})
    server.listen(process.env.PORT || port) 
  }
  return {start, server}
}

module.exports = {
  get_server,
  handle_gossip,
  return_peers
}
