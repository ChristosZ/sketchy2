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

app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname);
app.use(express.static(__dirname));


//global arrays
var people = {};
var rooms = {};
var sockets = [];

//ROUTING
//main page 
app.get('/', function(req, res){
	console.log('- Request received:', req.method.cyan, req.url.underline);
	
	//render index.html
	res.render("login.html");

	//send the current public room

	//when someone joins 
	//res.redirect('/' + req.params.roomName + '/' + req.params.userName);

});



app.get('/:roomName/:user', function(req, res) {
	var roomName = req.params.roomName;
	var userName = req.params.userName;

	if (_.contains(rooms, roomName)) {
		console.log('- Request received:', req.method.cyan, req.url.underline);
		res.render("sketcher.html", {});
	} else if (_.contains(people, userName)) {
		res.redirect('/');
	} else {
		res.redirect('/');
	}

});

//catch all
app.get('*', function(req, res){
	console.log('- Request received:', req.method.cyan, req.url.underline);

	res.render('sketcher.html');

});


server.listen(8080, function(){
    console.log('- Server listening on port 8080'.grey);
});

function User(name, tribe, socket) {
	this.name = name;
	this.id = -1;
	this.socket = socket;
	this.disconnected = false;
	this.tribe = tribe;
	this.inRoom = '';
	this.sketch = '';
	this.viewing = [];
	this.host = false;
	this.numSub = 0;
}

User.prototype.updateSketch = function(dataURL) {
	this.sketch = dataURL;
}

function Room(name, host, tribe) {
  this.name = name;
  this.tribe = tribe;
  this.id = -1;
  this.host = 'host';
  this.people = [];
  this.peopleLimit = 50;
  this.private = false;
  this.submitted = [];
};

Room.prototype.addUser = function(user) {
	
	if(_.contains(this.people, user)) {
		//user is already in room
	} else {
		this.people.push(user);
	}
}

Room.prototype.rmUser = function(user) {

	var index = _.indexOf(this.people, user);
  	this.people.splice(personIndex, 1);

}

Room.prototype.addSketch = function(user, dataURL, notes) {
	var numSub = people[user].numSub;
	var sketch = {'user': user, 'sketch': dataURL, 'notes': notes, 'tribe': tribe};
	this.submitted.push(sketch);

	return sketch;
}

//SOCKETS
io.sockets.on('connection', function(socket) {

	socket.on('createRoom', function(room, user, tribe) {

		if(_.contains(rooms, room)) {
			//user a new room name
		} else if(_.contains(people, user)) {
			//use a new username
		} else {
	
			var room = new Room(room, user, tribe);
			var host = new User(user, tribe);
			
			host.host = true;
			room.host = user;

			socket.join(room);
			
			people[user] = user;
			rooms[room] = room;
			rooms[room].addUser(user);

			//check if public or private
			numRooms = _.size(rooms);
			numPeople = _.size(rooms[room].people)

			socket.emit('addRoom', room.name, room.tribe, _.size(room.people), _.size(room.submitted));
	}

	});

	socket.on('updateRoom', function(room, tribe) {
		rooms[room].tribe = tribe;

	});

	socket.on('removeRoom', function(host, room) {


    });

	socket.on('joinRoom', function(room, user, tribe) {

		if(_.contains(people, user)) {
			//notify user to try a different username 
		} else {
			var user = new User(user, tribe);
			user.inRoom = room;
			people[user] = user;
			rooms[room].addUser(user);
			
			socket.join(room);
			socket.emit('redirect', callback);
		}

	});

	socket.on('updateTribe', function(tribe) {

		var user = sockets[socket.id];


		if(_.contains(people, user)) {
			people[user].tribe = tribe;
		} 

	});

	socket.on('leaveRoom', function(){
		var user = sockets[socket.id];

		var room;


        people[user] = null;
        //rooms[room].rmUser(user);
        socket.leave(room);


        //detect if there are people in the room

    });

    socket.on('disconnect', function(){

    });

	socket.on('updateSketch', function( data) {
		var room;
		var user;


		console.log('image received');

		people[user].sketch = data;

		numPeople = _.size(people);
		console.log(numPeople);

		io.to(room).emit('view', data);

		//addviewer()

		//add array of users, submit the sketch only when soeone is viewing it

		//take the users sketch and add the updates to the global array
		//emit the changes to the client (:/roomName/images)
	});


	socket.on('submitSketch', function(room, user, data, notes) {

		console.log('image submitted');
		console.log(notes);
		console.log(data);

		people[user].sketch = data;
		var sketch = rooms[room].addSketch(user, data, notes);

		io.to(room).emit('sketchSubmitted', sketch);

	});

    socket.on('viewSketch', function(user, vSketchUser){

    	//add the user to the list of people viewing the sketch

    });

 

});