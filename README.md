## Gossiper 

This is a demo implementation of gossip protocol. 

Each client has a favorite book that changes every 10 seconds. 
The objective is that all nodes are aware of each other node's favorite book.
The network is fault tolerant to nodes going down with the exception of the introducer, the introducer can't go down...
A node will periodically ping it's peers to get any new peers their aware of. The introducer is only pinged at startup and maintains a list of all nodes

## Running it 
```bash 
git clone <uri>

cd <directory>
npm install
```

**Start the introducer**
```bash
node introducer.js
```

**Start as many clients as you want**
```bash
PORT=<any valid port number> npm start
```
