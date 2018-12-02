## Book whisperer 

This is a demo implementation of gossip protocol implemented in javascript. 

Each client has a favorite book that changes every 10 seconds. 
The objective is that all nodes are aware of each other node's favorite book.
The network is fault tolerant to nodes going down but if the introducer goes down new nodes won't have a method of discoverying peers

A node will periodically ping its peers to get any new peers they're aware of. The introducer is only pinged at startup and maintains a list of all nodes

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
