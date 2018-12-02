const assert = require('assert')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const {get_server, handle_gossip, return_peers} = require('./server')
const P = require('bluebird')
const request = P.promisifyAll(require('request'))
const bunyan = require('bunyan');
const log = bunyan.createLogger({
	name: "index",
	pid: `port=${process.env.PORT}`
});

const MASTER_NODE_PORT = '1111'
const ROOT_URI = 'http://localhost:'
/* 
state: 
{
	favorite_book, 
	version, 
	peers: [],
	others_favorite_books: {<id>: {book, version}},
	recent_messages: new Set()
}


message: 
{
	originator:,
	TTL:,
	uuid,
	payload,
}
*/


/* 
startup
* pick book 
* call master node to init peer list (send port i'll listen on)
* set timers (refresh timers)
* listen on port
*/

const run = P.coroutine(function* (port, master_node) {
	log.info('starting up', {port: port})
	const state = initial_state({favorite_book: pick_random_book(), version: 1, my_port: port})
	const peers = yield lookup_peers(process.env.PORT, MASTER_NODE_PORT)
	state.peers = new Set(peers)
	const {start, server} = get_server(port)
	const gossip_handler = handle_gossip(state, handle_message)
	const send_peers = return_peers(state)
	server.get('/peers', send_peers)
	server.post('/gossip', gossip_handler)
	update_book = book_update_dater(state)
	action_at_interval(update_book, 10 * 1000)
	setInterval(() => update_state_display(state), 2 * 1000)
	start()
})


function update_state_display(state) {
	 process.stdout.write('\033c'); // clear iterm
	 console.log('')
	 log.info('My state:\n', state)
}

function action_at_interval(action, timeout) {
	setInterval(action, timeout)
}

function lookup_peers(my_port, their_port) {
	return request.getAsync({
		url: ROOT_URI.concat(their_port, '/peers'), 
		qs: {port: my_port}
	})
	.then(({body}) => JSON.parse(body))
	.then(({peers}) => peers.filter(p => p !== String(my_port)))
}

function pick_random_book() {
	books = fs.readFileSync('./books.txt', 'utf-8').split('\n')
	randomInt = Math.floor(Math.random() * Math.floor(books.length))
	return books[randomInt]
}

function book_update_dater(state) {
	return () => {
		const favorite_book = pick_random_book()
		state.favorite_book = favorite_book
		state.version = state.version + 1
		message = {
			originator: process.env.PORT, 
			TTL: 10, 
			uuid: uuidv4(), 
			payload: {book: favorite_book, version: state.version}
		}
		forward_message(state, message)
	}
}

function initial_state(overrides) {
	return Object.assign({
		my_port: 80,
		favorite_book: 'Fountain head',
		version: 1, 
		peers: new Set([]),
		others_favorite_books: {},
		recent_messages: new Set()
	}, overrides)
}

function build_message(overrides) {
	const defaults = {
		originator: null,
		TTL: 10,
		uuid: uuidv4(),
		payload: {}
	}
	return Object.assign(
		defaults, 
		overrides
	)
}

function forward_message(state, message) {
	P.resolve(state.peers.values())
	.map((peer) => {
		log.debug('forwardingint to', `http://localhost:${peer}/gossip`, message)
		request.postAsync(`http://localhost:${peer}/gossip`, {body: message, json: true})
		.catch((e) => {
			log.warn('removing peer', {peer: peer})
			state.peers.delete(peer)
		})
	})
}

function handle_message(state, message) {
	if (state.recent_messages.has(message.uuid)) {
		log.debug('seen message, doing nothing')
		return
	}
	updated_state = update_state(state, message)
	log.debug('updated_state', updated_state)
	if (message.TTL > 1) {
		forward_message(
			state,
			Object.assign(message, {TTL: message.TTL - 1})
		)
	} else {
		log.warn('message.TTL expired')
	}
}

function have_seen_this_message(state, messageID) {
	return state.recent_messages.has(messageID)
}

// update recent messages
// update known list 
function update_state(state, message) {
	state.peers.add(message.originator)
	state.recent_messages.add(message.uuid)	
	state.others_favorite_books = update_known_favorites(
		state.others_favorite_books, 
		message.originator, 
		message.payload.version,
		message.payload.book
	)
	return state
}

function update_known_favorites(known, sender, version, book) {
	current_favorite_for_peer = known[sender]
	if (!current_favorite_for_peer) {
		known[sender] = {version: version, book: book}
	} else if (current_favorite_for_peer.version < version) {
		known[sender] = {version: version, book: book}
	} 
	return known
}

// tests
state = initial_state()
assert.equal(have_seen_this_message(state, '1234'), false)
state.recent_messages.add('1234')
assert.equal(have_seen_this_message(state, '1234'), true)

assert.deepEqual(
	update_state(initial_state(), build_message({originator: 88, uuid: 1234, payload: {book: 'dog', version: 1}})), 
	{
		my_port: 80,
		favorite_book: 'Fountain head',
		version: 1, 
		peers: new Set([88]),
		others_favorite_books: {88: {book: 'dog', version: 1}},
		recent_messages: new Set([1234])
	}
)

known = {80: {version: 1, book: 'cat'}}
sender = 80
version = 1
book = 'bat'
assert.deepEqual(update_known_favorites(known, sender, version, book), known)
assert.deepEqual(update_known_favorites(known, sender, 2, book), {80: {version: 2, book: 'bat'}})
assert.deepEqual(update_known_favorites({}, sender, 2, book), {80: {version: 2, book: 'bat'}})


run(process.env.PORT)
