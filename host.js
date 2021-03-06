window.addEventListener('load', function(){

var drawBtn = $('#btn_draw');
var eraseBtn = $('#btn_erase');

var canvas = $('#canvas');
var canvas0 = $('#canvas_layer0');
var canvasImg = $('#canvas_img');
var ctx = canvas0[0].getContext('2d');

var tribes = ['blue', 'green', 'yellow', 'orange', 'red', 'purple'];
var tribe = 'blue';
var mode = 'draw';
var color = 'rgb(43,87,153)';
var brushSize = 6;
var eraserSize = 7;
var undolimit = 5;

hover(drawBtn);
$('#size_slider').val((brushSize*10)-1);

canvas0[0].width = canvas0[0].offsetWidth;
canvas0[0].height = canvas0[0].offsetHeight;
ctx.fillStyle = 'white'; //canvas is transparent by default
ctx.fillRect(0, 0, canvas0.width(), canvas0.height());
ctx.fill();

/*************************
****** SOCKETS ***********
**************************/
function meta(name) {
    var tag = document.querySelector('meta[name=' + name + ']');
    if (tag != null)
        return tag.content;
    return '';
}
var socket = io.connect();

var userName = meta('userName');
var roomName = meta('roomName');

socket.emit('updateSocket', userName, roomName);

send('sketch');

function send(mode, notes) {
 
	var dataURL = canvas0[0].toDataURL();
	if(mode == 'sketch') {
		socket.emit('updateSketch',dataURL);
	}
	if(mode == 'submit') {
		socket.emit('submitSketch', dataURL, notes);
	}
}

socket.on('userJoined', function(name, tribe){
	//userJoined should add a new tile for the sketches
	tileAdd(name, tribe, true);
	console.log('user ' + name + " has joined room.");
});

socket.on('tribeUpdated', function(name, tribe) {
	tileChange(name, tribe, true);
});

socket.on('sketchSubmitted', function(data) {
	tileAdd(data.user, data.tribe, false);
	sketchUpdate(data.user, data.sketch);
	tileAdd(data.user.substring(0,data.user.indexOf('_')), data.tribe, false);
	sketchUpdate(data.user.substring(0,data.user.indexOf('_')), data.sketch);
});

socket.on('sketchUpdated', function(data) {
	sketchUpdate(data.user, data.sketch);
});

socket.on('userLeft', function(data) {
	tileRemove(data);
});

socket.on('alert', function(text) {
	alert(text);
});


socket.on('start', function(newTribe){
	
	var i = tribes.indexOf(newTribe);
	for (n = 0; n < i; n++) {
		$('#btn_tribes').click();
	}

	tribe = newTribe;
});

socket.on('restart', function(newTribe, sketch) {

	var i = tribes.indexOf(newTribe);
	for (n = 0; n < i; n++) {
		$('#btn_tribes').click();
	}

	tribe = newTribe;
	canvas0.attr('src', sketch);
});


//TODO: fixes & bugs:
//First line takes a while to register?
//draw off page quickly breaks the line
//click and drag off bottom in IE scrolls a bit
//keep drawing when off screen
//IE: pull up options sidebar, then pull down, gets sticky
//make tribe button hoverable
//make sketch tiles clickable and scrollable with buttons
//add vertical scrollbar in view mode and filtering

/****************************
 * General display behavior *
 ****************************/

var cCont = $('#canvas_container');
var tBar = $('#tile_controls');
var tCont = $('#tile_container');
var rotateMsg = $('#rotate_screen_msg');
//var btnConts = $('.btn_container');

canvas.css('margin-top', Math.max((cCont.height() - cCont.width()*0.75)/2, 0));
rotateMsg.css('margin-top', (cCont.height()-rotateMsg.height())/2);
centerImage(canvasImg);

$('.btn_container').each(function(i) {
	$(this).css('top', 'calc((100vh - ' + $(this).height() + 'px) / 2)');
});

$(window).resize(function() {
	canvas.css('margin-top', Math.max((cCont.height() - cCont.width()*0.75)/2, 0));
	rotateMsg.css('margin-top', (cCont.height()-rotateMsg.height())/2);
	centerImage(canvasImg);
	
	clearTimeout(window.resizedFinished);
	if (trackimage.indexOf(canvas0[0].toDataURL()) == -1)
		trackimage.push(canvas0[0].toDataURL());
	
    window.resizedFinished = setTimeout(function(){
    	canvas0[0].width = canvas0[0].offsetWidth;
	    canvas0[0].height = canvas0[0].offsetHeight;
        var newtrack = new Image();
		newtrack.src = trackimage[trackimage.length-1];
		ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
		newtrack.onload = function() {ctx.drawImage(newtrack,0,0,canvas0[0].width,canvas0[0].height);}
    }, 250);
});

function centerImage (jObj) {
	var mTop = Math.max((cCont.height() - jObj.height())/2, cCont.height()*0.05);
	var mLeft = Math.min((cCont.height() - jObj.height())/2, cCont.width()*0.05);
	jObj.css('margin-top', mTop);
	jObj.css('margin-left', mLeft);
}

$('.hover').mouseenter(function(e){
	hover($(this));
})

$('.hover').mouseleave(function(e){
	var obj = $(this);
	var id = obj.attr('id').substring(4); 
	if (id == mode) hover(obj);
	else if (id == 'active' && showActiveClicked) { hover(obj); }
	else if (id == 'posted' && showPostedClicked) { hover(obj); }
	else unhover(obj);
})

$('.hover').on('mousedown touchstart', function(e){
	var obj = $(this);  
	var addr = obj.css('background-image');
	toggleHover(obj);
})

$('.hover').on('mouseup touchend', function(e){
	var obj = $(this);
	var id = obj.attr('id').substring(4);
	
	if (id != 'draw' && id != 'erase') toggleHover(obj);
	else if (id == 'active' && showActiveClicked) { hover(obj); }
	else if (id == 'posted' && showPostedClicked) { hover(obj); }
	else setMode(obj);
})

$('#size_slider').on('pointerup mouseup touchend', function(e){
	var obj = $(this);
	var size = (parseInt(obj.val())+1)/10;
	if (mode == 'erase') eraserSize = size;
	else if (mode == 'draw') brushSize = size;
});

function hover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_c.png') == -1)
		jObj.css('background-image', addr.replace('.png','_c.png'));
}

function unhover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_c.png') != -1)
		jObj.css('background-image', addr.replace('_c.png','.png'));
}

function toggleHover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_c.png') != -1)
		jObj.css('background-image', addr.replace('_c.png','.png'));
	else
		jObj.css('background-image', addr.replace('.png','_c.png'));
}

function setMode (jObj) {
	hover(jObj);
	
	var newMode = jObj.attr('id').substring(4);
	if (mode != newMode) { //not already in this mode, switch modes
		if (newMode == 'draw') {
			unhover(eraseBtn);
			$('#size_slider').val((brushSize*10)-1);
			mode = 'draw';
		}
		else if (newMode == 'erase') {
			unhover(drawBtn);
			$('#size_slider').val((eraserSize*10)-1);
			mode = 'erase';
		}
	}
}

function help (jObj) {
	var addr = jObj.css('background-image');	
	if (addr.indexOf('.png') != -1 && addr.indexOf('_h.png') == -1) {
		addr = addr.replace('.png','_h.png');
		jObj.css('background-image', addr);
	}
	else if (addr.indexOf('.svg') != -1 && addr.indexOf('_h.svg') == -1) {
		addr = addr.replace('.svg','_h.svg');
		jObj.css('background-image', addr);

	}
}

function unhelp (jObj) {
	var addr = jObj.css('background-image');
	jObj.css('background-image', addr.replace('_h.png','.png').replace('_h.svg','.svg'));	
}

$('#btn_help').hover(function(e){
	$('.help').each(function(i) { help($(this)); });
});

$('#btn_help').on('taphold', function(e){
	$('.help').each(function(i) { help($(this)); });
});

$('#btn_help').on('mouseout pointerout touchleave', function(e){
	$('.help').each(function(i) { unhelp($(this)); });
});

$('#btn_canvas_hide').click(function(e){
	$('#btn_canvas_show').show();
	$('#btn_canvas_hide').hide();
	$('#left_sidebar_container').hide();
	$('#canvas').hide();
	/* buggy
	if (showingTiles()) { //slideshow mode
		canvasImg.attr('src', canvas0[0].toDataURL());
		$('#canvas_img').show();
//		$('#left_sidebar_container2').show();
	}
	*/
});

$('#btn_canvas_show').click(function(e){
	$('#btn_canvas_show').hide();
	$('#btn_canvas_hide').show();
//	$('#left_sidebar_container2').hide();
	$('#left_sidebar_container').show();
//	$('#canvas_img').hide();
	$('#canvas').show();
});

$('#btn_sketches_hide').click(function(e){
	$('#btn_sketches_show').show();
	$('#btn_sketches_hide').hide();
	$('#right_sidebar_container').hide();
	$('#right_sidebar_container2').show();
	$('#tile_container').hide();
//	$('#canvas_img').hide();
//	$('#left_sidebar_container2').hide();
});

$('#btn_sketches_show').click(function(e){
	$('#btn_sketches_show').hide();
	$('#btn_sketches_hide').show();
	$('#right_sidebar_container2').hide();
	$('#right_sidebar_container').show();
	$('#tile_container').show();
	refreshTileSizes();
	/* buggy	
	if (!showingCanvas()) {
		$('#canvas_img').show();
//		$('#left_sidebar_container2').show();
	}
	*/
});

function showingTiles () {
	return ($('#right_sidebar_container').css('display') !== 'none');
}

function showingCanvas () {
	return ($('#btn_canvas_hide').css('display') !== 'none');
}

/*************************
 * tile sidebar controls *
 *************************/

var tiles = []; //one per viewable user
var tilesPerLine = 3; //how many tiles to fit lengthwise
var borderColors = [];
borderColors['blue'] = 'rgb(43,87,153)';
borderColors['green'] = 'rgb(84,131,59)';
borderColors['yellow'] = 'yellow'; //'rgb(191,147,45)';
borderColors['orange'] = 'orange'; //'rgb(198,93,40)';
borderColors['red'] = 'red'; //'rgb(219,54,39)';
borderColors['purple'] = 'rgb(175,96,166)';

var showActiveClicked = true;
var showPostedClicked = true;
var filterColor = 'all';
var filterColorOptions = ['all','blue','green','yellow','orange','red','purple'];
var viewingTile = undefined;
hover($('#btn_posted'));
hover($('#btn_active'));

refreshTiles();
$(window).resize(function() {refreshTileSizes()});

//call on 'sketch update' socket event
function sketchUpdate (username, dataURL) {
	var tile = $('#' + username);
	if (tile.length !== 0) {
		tile.attr('src', dataURL);
		//if (username == viewingTile) canvasImg.attr('src', dataURL);
	}
}

//call on 'updated user' socket event
function tileChange (username, tribe, active) {
	var i = getTileIndex(username);
	if (i !== -1) {
		tiles[i].tribe = tribe;
		tiles[i].active = active;
		
		var tile = $('#' + username);
		if (tile.length !== 0) tile.css('border-color', borderColors[tribe]);
		return;
	}
	tileAdd(username, tribe, active); //didn't find tile, add instead
}

//call on 'added user' socket event
function tileAdd (username, tribe, active) {
	var i = getTileIndex(username);
	if (i !== -1) {
		tileChange(username, tribe, active); //already exists, update
		return;
	}
	tiles.push({username: username, tribe: tribe, active: active});
	addTileToView(username, tribe, active);
}

//call on 'removed user' socket event
function tileRemove (username) {
	var i = getTileIndex(username);
	if (i === -1) return; //is not there to remove
	
	tiles.splice(i,1);
	var tile = $('#' + username);
	if (tile.length !== 0) tile.remove();
}

function addTileToView (username, tribe, active) {
	var tile = $('<img class=tile></canvas>');
	tile.attr('id', username);
	
	tile.css('border-color', borderColors[tribe]);
	tCont.append(tile);
	refreshTileSizes();
	
	/* buggy with no time to debug so removed from submitted version
	tile.click(function(e){
		var username = $(this).attr('id');
		if (getTileIndex(username) === -1) {
			refreshTiles();
			return;
		}
		if (!showingCanvas()) {
			canvasImg.fadeOut(300);
			setTimeout(function (){
				canvasImg.attr('src', $(this).attr('src'));
			}, 300);
			canvasImg.fadeIn(300);
		}
		viewingTile = username;
	});
	*/
}

function getTileIndex (username) {
	for (var i in tiles) {
		if (tiles[i].username === username)
			return i;
	}
	return -1;
}

function refreshTileSizes () {
	$('.tile').css('width', 'calc((100% / ' + tilesPerLine + ' * 0.80) - 6px)');
	$('.tile').css('margin', 'calc((100% / ' + tilesPerLine + ' * 0.18)/2)');
	var tile = $();
	$('.tile').each(function () {
		var t = $(this);
		t.css('height', t.width()*0.75);
	});
}

function refreshTiles () {
	tCont.empty();
	for (i = 0; i < tiles.length; i++) {
		var t = tiles[i];
		addTileToView(t.username, t.tribe, t.active);
	}
	refreshTileSizes ();
}

$('#btn_zoom_in').click(function(e){
	tilesPerLine = Math.max(--tilesPerLine, 1);
	refreshTileSizes();
});

$('#btn_zoom_out').click(function(e){
	tilesPerLine = Math.min(++tilesPerLine, 5);
	refreshTileSizes();
});

//fStatus can be 'all', 'active' or 'posted'
function tileFilter (fStatus, fTribe) {
	var foundMatch = false;
	
	for (i = 0; i < tiles.length; i++) {
		var t = tiles[i];
		var statusValid = (fStatus == 'all')|(fStatus==(t.active?'active':'posted'));
		var colorValid = (fTribe == 'all' | t.tribe == fTribe);
		if (statusValid && colorValid) {
			$('#' + t.username).show();
			foundMatch = true;
		}
		else $('#' + t.username).hide();
	}
	refreshTileSizes();
	return foundMatch;
}

$('#btn_active').click(function(e){
	if (showActiveClicked === true) {
		showActiveClicked = false;
		unhover($(this));
		if (showPostedClicked) tileFilter('posted', filterColor);
		else $('#btn_posted').click();
	} else {
		showActiveClicked = true;
		hover($(this));
		if (showPostedClicked) tileFilter('all', filterColor);
		else tileFilter('active', filterColor);
	}
});

$('#btn_posted').click(function(e){
	if (showPostedClicked === true) {
		showPostedClicked = false;
		unhover($(this));
		if (showActiveClicked) tileFilter('active', filterColor);
		else $('#btn_active').click();
	} else {
		showPostedClicked = true;
		hover($(this));
		if (showActiveClicked) tileFilter('all', filterColor);
		else tileFilter('posted', filterColor);
	}
});

$('#btn_tribe').click(function(e){
	if (tiles.length == 0) return;
	var colorsTried = 0;
	var stat =(showPostedClicked ?(showActiveClicked ?'all':'posted'):'active');
	
	while (colorsTried < filterColorOptions.length) {
		var i = filterColorOptions.indexOf(filterColor);
		filterColor = filterColorOptions[++i % filterColorOptions.length];
		
		if (tileFilter(stat, filterColor)) return; //found tiles of color
		colorsTried++;
	}
});

/*********************
 * Drawing functions *
 *********************/

var drawing = false,
	prevX = 0,
	currX = 0,
	prevY = 0,
	currY = 0;
var trackimage = new Array();
trackimage.push(canvas0[0].toDataURL());
var step = 0;
$('#btn_undo').css("pointer-events", "none");
$('#btn_redo').css("pointer-events", "none");

canvas0.on('mousedown pointerdown', function (e) {findxy('down', e.originalEvent)});
canvas0.on('mousemove pointermove', function (e) {findxy('move', e.originalEvent)});
canvas0.on('mouseout pointerout',   function (e) {findxy('out',  e.originalEvent)});
canvas0.on('mouseup pointerup',	 function (e) {findxy('up',   e.originalEvent)});

canvas0.on('touchstart', function(e){findxy('down', e.originalEvent.changedTouches[0])});
canvas0.on('touchmove',  function(e){findxy('move', e.originalEvent.changedTouches[0])});
canvas0.on('touchleave', function(e){findxy('out',  e.originalEvent.changedTouches[0])});
canvas0.on('touchend',   function(e){findxy('up',   e.originalEvent.changedTouches[0])});

$(document).on('mouseup pointerup', function(e){ drawing = false; })
$(document).on('mousemove pointermove', function(e){
	if (drawing === true) findxy('move', e.originalEvent);
});

function draw() {
	ctx.beginPath();
	ctx.strokeStyle = (mode == 'erase') ? 'white' : color;
	ctx.lineWidth = (mode == 'erase') ? eraserSize : brushSize;
	ctx.lineJoin = "round";
	ctx.moveTo(prevX, prevY);
	ctx.lineTo(currX, currY);
	ctx.closePath();
	ctx.stroke();
}

function findxy(res, e) {
	if (e.type !== undefined) //not touch event
		e.preventDefault();
	
	if (res == 'down') {
		currX = e.clientX - canvas0[0].offsetLeft;
		currY = e.clientY - canvas0[0].offsetTop;
		drawing = true;
		ctx.beginPath();
		ctx.fillStyle = (mode == 'erase') ? 'white' : color;
		ctx.arc(currX, currY, brushSize/2, 0, 2*Math.PI);
		ctx.fill();
	}
	if (res == 'up') {
		if (drawing == true) {
			send('sketch');
		}
		drawing = false;
		push();
	}
	if (res == 'move' || res == 'out') {
		
		if (drawing) {
			prevX = currX;
			prevY = currY;
			currX = e.clientX - canvas0[0].offsetLeft;
			currY = e.clientY - canvas0[0].offsetTop;
			draw();
		}
	}
}

function push(){
	step++;
	$('#btn_undo').css("pointer-events", "auto");
	if (step < trackimage.length){
		trackimage = trackimage.slice(0, step);
	}
	if (trackimage.indexOf(canvas0[0].toDataURL()) == -1){
		trackimage.push(canvas0[0].toDataURL());
	}
	if (step > undolimit){
		step = undolimit;
		trackimage.shift();
	}	
}

/******************************
 * Other button functionality *
 ******************************/

$('.colorbtn').click(function(e){
	color = borderColors[$(this).attr('id')];
	setMode (drawBtn);
});

$('#btn_undo').click(function(e){
	if (trackimage.indexOf(canvas0[0].toDataURL()) == -1){
		trackimage.push(canvas0[0].toDataURL());
	}
	$('#btn_redo').css("pointer-events", "auto");
	if (step > 0){
		step --;
		var oldtrack = new Image();
		oldtrack.src = trackimage[step];
		var dURL = trackimage[step];
		socket.emit('updateSketch', dURL);
		ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
		oldtrack.onload = function (){ctx.drawImage(oldtrack,0,0);}
		if (step == 0){
			$('#btn_undo').css("pointer-events", "none");
		}
	}

});

$('#btn_redo').click(function(e){
	if (step < trackimage.length-1){
			step++;
			var newtrack = new Image();
			newtrack.src = trackimage[step];
			var dURL = trackimage[step];
			socket.emit('updateSketch', dURL);
			ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
			newtrack.onload = function() {ctx.drawImage(newtrack,0,0);}
			if (step == trackimage.length-1){
				$('#btn_redo').css("pointer-events", "none");
			$('#btn_undo').css("pointer-events", "auto");
		}
	}
	
});

$('#btn_save').click(function(e){
	alert('Right-click or touch and hold image on the right to save on your device.')
});

$('#btn_clear').click(function(e){
	if (confirm('This will clear your sketch, are you sure?')) {
		canvas.fadeOut(300);
		
		setTimeout(function (){
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas0[0].width, canvas0[0].height);
			ctx.fill(); //clear canvas
			//canvasImg.attr('src', canvas0[0].toDataURL());
		}, 300);
		
		send('sketch');
		canvas.fadeIn(300).css('display', 'block');
	}
});

$('#btn_mirror').click(function(e){
	var lBar = $('#left_sidebar');
	var rBar = $('#right_sidebar');
	
	if (lBar.css('float') == 'left') { //original layout
		lBar.css('float', 'right');
		rBar.css('float', 'left');
		$('#btn_canvas_show, #btn_canvas_hide').css('float', 'right');
		$('#canvas_container').css('float', 'right');
	}
	else { //reverse layout
		lBar.css('float', 'left');
		rBar.css('float', 'right');
		$('#tile_container').css('float', 'right');
		$('#canvas_container').css('float', 'left');
	}	
	
	var lAddr = lBar.css('background-image');
	var rAddr = rBar.css('background-image');
	lBar.css('background-image', rAddr);
	rBar.css('background-image', lAddr);
	unhover($(this));
});

$('#btn_post').click(function(e){
	var notes = prompt("This will permanently submit your sketch. Add any notes here:");
	if (notes != null) {
		send('submit', notes);
		send('sketch');
	}
});

$('#btn_close').click(function(e){
	if (confirm('Are you sure you want to permanently leave this room?')) {
		socket.emit('leaveRoom');
		window.location.replace('/');
	}
});

$('#btn_save_all').click(function(e){
	var picsHTML = $('#pics')[0];
	$('.tile').each(function() {
		document.getElementById('pics').href = $(this)[0].src;
		document.getElementById('pics').download = $(this).attr('id') + '.png';
		document.getElementById('pics').click();
	});
});

$('#btn_tribes').click(function(e){
	var i = tribes.indexOf(tribe);
	var newTribe = tribes[++i % tribes.length];
	
	$('.btn').each(function(i) {changeTribe($(this), tribe, newTribe)});
	$('.btn .help').each(function(i) {changeTribe($(this), tribe, newTribe)});
	$('.sidebar').each(function(i) {changeTribe($(this), tribe, newTribe)});
	changeTribe($('#rotate_screen'), tribe, newTribe);
	changeTribe($('#rotate_screen_msg'), tribe, newTribe);
	changeTribe($('#small_screen'), tribe, newTribe);
	changeTribe($('#small_screen_msg'), tribe, newTribe);
	
	tribe = newTribe;
	socket.emit('updateTribe', tribe);
});

function changeTribe (obj, oldTribe, newTribe) {
	var oldAddr = obj.css('background-image');
	var newAddr = oldAddr.replace('/img/' + oldTribe + '/', '/img/' + newTribe + '/');
	obj.css('background-image', newAddr);
}

window.addEventListener("beforeunload", function (e) {
	var confirmationMessage = 'Are you sure you want to leave this room?';
	e.returnValue = confirmationMessage;
	return confirmationMessage;
});

}, false)
