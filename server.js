var fs = require('fs'),
colors = require('colors'),
express = require('express'),
engines = require('consolidate'),
http = require('http'),
parser = require('body-parser'),
_ = require('underscore')._;

var app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.engine('html', engines.hogan); 
app.set('views', __dirname);

app.use(express.static(__dirname));
app.use(express.bodyParser());

//global array of rooms
var rooms = {};

//ROUTING
app.get('/', function(req, res){
	console.log('- Request received:', req.method.cyan, req.url.underline);
	res.render("login.html");

});

//for serving the .js and .css to dynamic routes
app.get('/:roomName/img/:color/:file', function(req, res) {
	var color = req.params.color;
	var file = req.params.file;
	res.sendfile("img/" + color + "/" + file);
});

app.get('/img/:color/:file', function(req, res){
	var color = req.params.color;
	var file = req.params.file;
	res.sendfile("/img/" + color + "/" + file);
});

app.get('/:roomName/host.css', function(req, res) {
	res.sendfile('host.css');
});

app.get('/:roomName/host.js', function(req, res) {
	res.sendfile('host.js');
});

app.get('/:roomName/sketcher.js', function(req, res) {
	res.sendfile("sketcher.js");

});

app.get('/:roomName/sketcher.css', function(req, res) {
	res.sendfile("sketcher.css");

});

app.get('/:roomName/:userName', function(req, res) {
	console.log('- Request received:', req.method.cyan, req.url.underline);
	
	var roomName = req.params.roomName;
	var userName = req.params.userName;

	//make sure theyre either a host or a user

	if (rooms[roomName] === undefined) {
		res.redirect('/');
	} else if (userName === rooms[roomName].host) {
		res.render("host.html", {roomName: roomName, userName: userName});
	} else if (!(_.find(rooms[roomName].people, function(u) {return u.name === userName}) === undefined)) {
		//if the user isnt already in the room, then they can log in. if they are, then the user is redirected
		if (_.find(rooms[roomName].people, function(u) {return u.name === userName}).sketch === '') {
			res.render("sketcher.html", {roomName: roomName, userName: userName});
		} else {
			res.redirect('/');
		}
	}	else {
		res.redirect('/');
	}

});

//catch all redirects to login page
app.get('*', function(req, res){
	console.log('- Request received:', req.method.cyan, req.url.underline);
	res.redirect('/');
	
});

server.listen(8080, function(){
	console.log('- Server listening on port 8080'.grey);
});


//USER AND ROOM DEFS
function User(name, tribe) {
	this.name = name;
	this.tribe = tribe;
	this.id = '';
	this.disconnected = false;
	this.leftRoom = false;
	this.sketch = '';
	this.viewing = [];
	this.host = false;
	this.numSub = 0;
};

function Room(name, tribe, host) {
	this.name = name;
	this.tribe = tribe;
	this.host = host;
	this.people = {}; // array of users in the room, ordered by username
	this.private = false;
	this.submitted = [];
};

User.prototype.updateSketch = function(dataURL) {
	this.sketch = dataURL;
};

Room.prototype.addSketch = function(userName, dataURL, notes) {
  	var user = this.people[userName];
  	console.log(this.people[userName]);
  	newName = user.name + "_" + user.numSub.toString();
  	var sketch = {user: newName, sketch: dataURL, notes: notes, tribe: user.tribe};
  	this.submitted.push(sketch);
  	return sketch;
  };

function getUser (socket) {

	if(rooms[socket.room] !== undefined) {


  	var room = socket.room;
  	user = _.find(rooms[room].people, function(u) {return u.id === socket.id});
  	return user;
  	} else 
  	{return null;}

};

//SOCKETS
io.sockets.on('connection', function(socket) {

	socket.on('reqRooms', function(){

		_.each(rooms, function(val, key, obj) {
			var active = 0;

			_.each(val.people, function(val, key, obj) {
				if(val.disconnected === false) active++;
			})
			
			socket.emit('addRoom', val.name, val.tribe, active, _.size(val.submitted));
		})
	});

	socket.on('createRoom', function(roomName, userName, tribe) {

		//check if the username and roomname are valid
		if(!(_.find(rooms, function(r) {return r.name === roomName}) === undefined)) {
			//if room already exists
			socket.emit('alert', "This room name is taken. Please try a different one.");
		} else {
			var room = new Room(roomName, tribe, userName);
			var host = new User(userName, tribe);
			host.host = true;

			rooms[roomName] = room;
			rooms[roomName].people[userName] = host;

			io.sockets.emit('addRoom', room.name, room.tribe, _.size(rooms[roomName].people), _.size(rooms[roomName].submitted));
			socket.emit('redirect', "/" + roomName + "/"+ userName);
		}

	});

	socket.on('removeRoom', function(roomName) {
		//first make sure it's the host requesting this
		delete rooms[roomName];
		io.sockets.emit('roomRemoved', roomName);
		
	});

	socket.on('joinRoom', function(roomName, userName, tribe) {

		//check if the userName is valid, if roomName exists
		//console.log(tribe);
		if(!(_.find(rooms[roomName].people, function(u) {return u.name === userName}) === undefined)) {
			//notify user to try a different username 
			socket.emit('alert', "This username is taken in this room. Please try a different room or username.");
		} else {
			var user = new User(userName, tribe);
			console.log(roomName);
			rooms[roomName].people[userName] = user;
			socket.emit('redirect', '/' + roomName + '/' + userName);
		}

	});

	socket.on('updateSocket', function(userName, roomName){

		socket.room = roomName;
		socket.join(socket.room);

		var user = _.find(rooms[roomName].people, function(u) {return u.name === userName});
		user.id = socket.id;

		io.sockets.emit('updateRoom', roomName, rooms[roomName].tribe, _.size(rooms[roomName].people), _.size(rooms[roomName].submitted));
		io.to(socket.room).emit("userJoined", user.name, user.tribe); 

		if (user.disconnected === true) {
			socket.emit('restart', user.tribe, user.sketch);
		} else {
			console.log(user.tribe);
			socket.emit('start', user.tribe);
		}
		
		_.each(rooms[socket.room].people, function(val, key, obj) {
			var sketch = {user: val.name, sketch: val.sketch, tribe: val.tribe};
			socket.emit('userJoined', val.name, val.tribe);
			socket.emit('sketchUpdated', sketch);
			console.log('emitting');
		});
	});

	socket.on('updateTribe', function(tribe) {

		var user = getUser(socket);
		user.tribe = tribe;
		io.to(socket.room).emit("tribeUpdated", user.name, tribe);

		var room = _.find(rooms, function(r) {return r.host === user.name});
		
		//check if the person is the host. if they are, then the room itself has to be changed as well
		if (!(room === undefined)) {
			rooms[room.name].tribe = tribe;
			io.sockets.emit('updateRoom', room.name, tribe, _.size(room.people), _.size(room.submitted));
		} 

	});

	socket.on('leaveRoom', function(){

		var user = getUser(socket);
		var roomName = socket.room;

		if(rooms[socket.room] !== undefined){

		//if this is the last person, remove the room totally
		if (rooms[socket.room].people.length === 1) {
			
			delete rooms[socket.room];
			io.sockets.emit('roomRemoved', roomName);

		} else {

			delete rooms[socket.room].people[user.name];
			
			socket.leave(socket.room);
			io.to(room).emit("userLeft", user.name);
		}
		}
	});

	socket.on('disconnect', function(){
		
		//check to see if the socket was in a room 

		if (rooms[socket.room] === undefined) {
			//this user was not in a room yet, so their socket can be forgotten
		} else {
 
			var user = getUser(socket);
			user.id = '';
			user.disconnected = true; 
	}

	});

	socket.on('updateSketch', function(data) {

		//update the user's sketch data
		var user = getUser(socket);
		user.sketch = data;
		var viewing = user.viewing;
		var sketch = {user: user.name, sketch: user.sketch, tribe: user.tribe};

		for (var i = 0; i < viewing.length; i++) {
			//send the updated sketch to socket ids that are viewing
			io.to(viewing[i]).emit('sketchUpdated', sketch);
			//console.log(viewing[i]);
			//console.log('sketch updated');
		}

		var hName = rooms[socket.room].host;

		var user = _.find(rooms[socket.room].people, function(u) {return u.name === hName});

		//always send to host
		console.log(user.id);
		io.to(user.id).emit('sketchUpdated', sketch);	

	});


	socket.on('submitSketch', function(data, notes) {

		//submit sketch to room's array
		var user = getUser(socket);
		user.sketch = data;
		user.numSub++;

		var sketch = rooms[socket.room].addSketch(user.name, data, notes);

		//console.log(data);
		io.to(socket.room).emit('sketchSubmitted', sketch);

	});

	socket.on('viewSketch', function(vName){

		if(vName.indexOf('_') === -1) {
			//add the user to viewing array
			var user = _.find(rooms[socket.room].people, function(u) {return u.name === vName});
			user.viewing.push(socket.id);
			var sketch = {user: user.name, sketch: user.sketch, tribe: user.tribe};
			io.to(socket.id).emit('sketchUpdated', sketch);
		} else {
			//find the sketch in submitted array
			var sketch = _.find(rooms[socket.room].submitted, function(i) {return i.user === vName});
			io.to(socket.id).emit('sketchUpdated', sketch);
		}

	});

	socket.on('noView', function(vName) {
    	//remove the socket from the list of people viewing

    	if(vName.indexOf('_') === -1) {
    		var user = _.find(rooms[socket.room].people, function(u) {return u.name === vName});
    		var index = _.indexOf(user.viewing, socket.id);
    		user.viewing.splice(index, 1);
    	} 

    });

});