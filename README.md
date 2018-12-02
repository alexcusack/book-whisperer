// using hard coded master node, connect and ask for peers. Connect to each of those, ask for 
// peers again until you have n peers.
// master node sends back a list of nodes to connect to.
// when the newcomer connects, add them to the list and bump someone else out. FIFO
	// this has a fault tolerance issue in bad actor scenerios, but can probably not worry about it for now
// Once peered, pick a random book from the list and set it as your v1 favorite 
// boardcast that book with a version number

// what does my internal state look like 
// function to get peers 
// function to update list of peer(s)
// function to take input message -- what state about other peers do I have to hold. 
// what happens if I kill node? how does the fault tolerance do
// message 

/* 
state: 
{
	favorite_book, 
	version, 
	peers: [],
	others_favorite_books: {<id>: {book, version}},
	recent_messages: {}
}


message: 
{
	originator:,
	TTL:,
	uuid,
	payload,
}
*/
