window.addEventListener('load', function(){

var vDrag = $('#view_drag');
var oDrag = $('#options_drag');
var vBar = $('#sidebar_view');
var oBar = $('#sidebar_options');
var drawBtn = $('#btn_draw');
var eraseBtn = $('#btn_erase');

var canvas = $('#canvas');
var canvas0 = $('#canvas_layer0');
var canvasImg = $('#canvas_img');
var ctx = canvas0[0].getContext('2d');

var vybar_start, oybar_start, vytouchstart, oytouchstart;
var vDragGrabbed = false;
var oDragGrabbed = false;

var tribes = ['blue', 'green', 'yellow', 'orange', 'red', 'purple']
var tribe = 'blue';
var mode = 'draw';
var color = 'blue';
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

/*******************
 ***** SOCKETS *****
 *******************/
/*
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
send('sketch', '');

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
	//should add the final sketch as a tile
});

socket.on('sketchUpdated', function(data) {

	data.user;
	canvasImg.attr('src', data.sketch);
	canvasImg.fadeIn(300);

});

socket.on('userLeft', function(data) {
	tileRemove(data);
});

socket.on('alert', function(text) {
	alert(text);
});


socket.on('start', function(newTribe){

	console.log(newTribe);
	var i = tribes.indexOf(newTribe);
	for (n = 0; n < i; n++) {
		$('#btn_tribes').click();
	}

	tribe = newTribe;
});

socket.on('restart', function(tribe, sketch) {

	tribe = tribe;
	canvas0[0].attr('src', sketch);

});
*/

/****************************
 * General display behavior *
 ****************************/

var cCont = $('#canvas_container');
var tBar = $('#tile_controls');
var tCont = $('#tile_container');
var rotateMsg = $('#rotate_screen_msg');

canvas.css('margin-top', Math.max((cCont.height() - cCont.width()*0.75)/2, 0));
rotateMsg.css('margin-top', (cCont.height()-rotateMsg.height())/2);
//ctx.fillStyle = 'white'; //clear canvas
//ctx.fillRect(0, 0, canvas0[0].width, canvas0[0].height);
//ctx.fill();

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

$('.hover').mouseenter(function(e){ hover($(this)); });

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
	
	if (id == 'draw' || id == 'erase') setMode(obj);
	else if (id == 'active' && showActiveClicked) { hover(obj); }
	else if (id == 'posted' && showPostedClicked) { hover(obj); }
	else toggleHover(obj);
});

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

function centerImage (jObj) {
	var mTop = Math.max((cCont.height() - jObj.height())/2, cCont.height()*0.05);
	var mLeft = Math.min((cCont.height() - jObj.height())/2, cCont.width()*0.05);
	jObj.css('margin-top', mTop);
	jObj.css('margin-left', mLeft);
}

function fadeOutTileBarContents (t) {
	$('#btn_up').fadeOut(t);
	$('#btn_down').fadeOut(t);
	tCont.fadeOut(t);
}

function fadeInTileBarContents (t) {
	tCont.fadeIn(300);
	refreshUpBtn();
	refreshDownBtn();
}

/*************************
 * tile sidebar controls *
 *************************/

var allTiles = []; //viewable users
var filteredTiles = []; //users who pass the filters
var tileIndex = 0; //index in 'filteredTiles' array of topmost viewing tile
var tileCapacity = 0; //how many tiles can visually fit in container
var viewingTile = undefined;
refreshTileSidebar();

$(window).resize(function () { refreshTileSidebar() });

function refreshTileSidebar () {
	var tile = $('<div class=tile></div>');
	
	var newTileCapacity = Math.floor(tCont.height()/tile.height());
	if (newTileCapacity == tileCapacity) return; //no action needed
	
	tileCapacity = newTileCapacity;
	refreshTileCont();
	refreshUpBtn();
	refreshDownBtn();
}

$('#btn_up').click(function(e){
	var newTileIndex = Math.max(0, tileIndex - tileCapacity);
	if (tileIndex != newTileIndex) {
		tileIndex = newTileIndex;
		refreshTileCont();
	}
	refreshUpBtn();
	refreshDownBtn();
});

$('#btn_down').click(function(e){
	var newTileIndex = Math.min(tileIndex + tileCapacity, filteredTiles.length - 1);
	if (tileIndex != newTileIndex) {
		tileIndex = newTileIndex;
		refreshTileCont();
	}
	refreshUpBtn();
	refreshDownBtn();
});

//call on 'updated user' socket event if passes filter
function tileViewChange (username, tribe, active) {
	var i = getTileViewIndex(username);
	if (i !== -1) {
		filteredTiles[i].tribe = tribe;
		filteredTiles[i].active = active;
		
		var tile = $('#' + username);
		if (tile.length !== 0) { //being displayed, update tile
			var oldAddr = tile.css('background-image');
			var newAddr = oldAddr.substring(0, oldAddr.length - 14);
			newAddr = newAddr + tribe.substring(0,1) + '_' + ((active) ? 'active' : 'posted') + '.png")';
			tile.css('background-image', newAddr);
		}
		return;
	}
	tileViewAdd(username, tribe, active); //didn't find tile, add instead
}

//call on 'added user' socket event if passes filter
function tileViewAdd (username, tribe, active) {
	var i = getTileViewIndex(username);
	if (i !== -1) {
		tileViewChange(username, tribe, active); //already exists, update
		return;
	}
	filteredTiles.push({username: username, tribe: tribe, active: active});
	if (filteredTiles.length - tileIndex <= tileCapacity)
		addTileToSidebar(username, tribe, active); //add to viewing tiles
		
	refreshDownBtn();
}

//call on 'removed user' socket event if passes filter
function tileViewRemove (username) {
	var i = getTileViewIndex(username);
	if (i === -1) return; //is not there to remove
	
	if (i < tileIndex) {
		filteredTiles.splice(i,1);
		tileIndex = tileIndex - 1;
		refreshUpBtn();
	} else if (i >= tileIndex + tileCapacity) {
		filteredTiles.splice(i,1);
		refreshDownBtn();
	} else { //currently viewed in sidebar
		filteredTiles.splice(i,1);
		var tile = $('#' + username);
		if (tile.length !== 0) tile.remove();
		
		var tileShiftedIntoView = tileIndex + tileCapacity - 1;
		if (tileShiftedIntoView < filteredTiles.length) {
			var t = filteredTiles[tileShiftedIntoView];
			addTileToSidebar(t.username, t.tribe, t.active);
		}
		refreshDownBtn();
		
		//if no more tiles in view
		if (tileIndex >= filteredTiles.length) $('#btn_up').click();
	}
}

function addTileToSidebar (username, tribe, active) {
	var tile = $('<div class=tile></div>');
	tile.attr('id', username);
	tCont.append(tile);

	var defaultAddr = tile.css('background-image');
	var newAddr = defaultAddr.substring(0, defaultAddr.length - 14);
	newAddr = newAddr + tribe.substring(0,1) + '_' + ((active) ? 'active' : 'posted') + '.png")';
	tile.css('background-image', newAddr);
	
	tile.click(function(e){
		var newUsername = $(this).attr('id');
		if (getTileViewIndex(newUsername) === -1) {
			refreshTileCont();
			return;
		}
		canvasImg.fadeOut(300);
		
		//console.log(viewingTile);
		if (viewingTile !== undefined) {
			socket.emit('noView', viewingTile);
			
		}
		viewingTile = newUsername;
		socket.emit('viewSketch', newUsername);
	});
}

function getTileViewIndex (username) {
	for (var i in filteredTiles) {
		if (filteredTiles[i].username === username)
			return i;
	}
	return -1;
}

function refreshUpBtn () {
	if (tileIndex == 0) {
		$('#btn_up').fadeOut(30);
		tCont.css('margin-top', '13mm');
	}
	else {
		tCont.css('margin-top', '');
		$('#btn_up').fadeIn(30);
	}
}

function refreshDownBtn () {
	if (tileIndex + tileCapacity < filteredTiles.length) $('#btn_down').fadeIn(30);
	else $('#btn_down').fadeOut(30);
}

function refreshTileCont () {
	//alert(filteredTiles.length);
	tCont.empty();
	for (i = 0; i < tileCapacity && tileIndex + i < filteredTiles.length; i++) {
		var t = filteredTiles[tileIndex + i];
		addTileToSidebar(t.username, t.tribe, t.active);
	}
}

/******************
 * tile filtering *
 ******************/

var showActiveClicked = true;
var showPostedClicked = true;
var filterColor = 'all';
var filterColorOptions = ['all','blue','green','yellow','orange','red','purple'];
hover($('#btn_posted'));
hover($('#btn_active'));

//fStatus can be 'all', 'active' or 'posted'
function tileFilter (fStatus, fTribe) {
	var foundMatch = false;
	var newFilteredTiles = [];

	for (i = 0; i < allTiles.length; i++) {
		var t = allTiles[i];
		var statusValid = (fStatus == 'all')|(fStatus==(t.active?'active':'posted'));
		var colorValid = (fTribe == 'all' | t.tribe == fTribe);
		if (statusValid && colorValid) {
			newFilteredTiles.push(t);
			foundMatch = true;
		}
	}
	filteredTiles = newFilteredTiles;
	refreshTileCont();
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
	if (allTiles.length == 0) return;
	var colorsTried = 0;
	var stat =(showPostedClicked ?(showActiveClicked ?'all':'posted'):'active');
	
	while (colorsTried < filterColorOptions.length) {
		var i = filterColorOptions.indexOf(filterColor);
		filterColor = filterColorOptions[++i % filterColorOptions.length];
		
		if (tileFilter(stat, filterColor)) return; //found tiles of color
		colorsTried++;
	}
});

/**************************************
 * tile add/remove/change for sockets *
 **************************************/

//call on 'added user' socket event
function tileAdd (username, tribe, active) {
	var i = getTileIndex(username);
	if (i !== -1) tileChange(username, tribe, active); //already exists, update
	else {
		allTiles.push({username: username, tribe: tribe, active: active});
		
		var passedColor = (filterColor == 'all') || (filterColor == tribe);
		var passedActive = (showActiveClicked === true && active === true);
		var passedPosted = (showPostedClicked === true && active === false);
		var passedMode = (passedActive || passedPosted);

		if (passedColor & passedMode) tileViewAdd(username, tribe, active);
	}
}

//call on 'updated user' socket event
function tileChange (username, tribe, active) {
	var i = getTileIndex(username);
	if (i === -1) tileAdd(username, tribe, active); //didn't find, add instead
	else {
		allTiles[i].tribe = tribe;
		allTiles[i].active = active;
		
		var passedColor = (filterColor == 'all') || (filterColor == tribe);
		var passedActive = (showActiveClicked === true && active === true);
		var passedPosted = (showPostedClicked === true && active === false);
		var passedMode = (passedActive || passedPosted);

		if (passedColor & passedMode) tileViewChange(username, tribe, active);
		else tileViewRemove(username, tribe, active);
	}
}

//call on 'removed user' socket event
function tileRemove (username) {
	var i = getTileIndex(username);
	if (i === -1) return; //is not there to remove
	
	allTiles.splice(i,1);
	tileViewRemove(username);
}

function getTileIndex (username) {
	for (var i in allTiles) {
		if (allTiles[i].username === username)
			return i;
	}
	return -1;
}

/***********************************************
 * 'touch' event handling for sidebar dragging *
 ***********************************************/

vDrag.on('touchstart', function(e){
	var e = e.originalEvent;
	vDragGrabbed = true;
	vBarGrab(parseInt(e.changedTouches[0].clientY));
	e.preventDefault();
})

vDrag.on('touchmove', function(e){
	var e = e.originalEvent;
	vBarMove(parseInt(e.changedTouches[0].clientY));
	e.preventDefault();
})

vDrag.on('touchend', function(e){
	var e = e.originalEvent;
	vDragGrabbed = false;
	vBarRelease();
	e.preventDefault();
})

oDrag.on('touchstart', function(e){
	var e = e.originalEvent;
	oDragGrabbed = true;
	oBarGrab(parseInt(e.changedTouches[0].clientY));
	e.preventDefault();
})

oDrag.on('touchmove', function(e){
	var e = e.originalEvent;
	oBarMove(parseInt(e.changedTouches[0].clientY));
	e.preventDefault();
})

oDrag.on('touchend', function(e){
	var e = e.originalEvent;
	oDragGrabbed = false;
	oBarRelease();
	e.preventDefault();
})

/**********************************************************
 * mouse/pointer (IE) event handling for sidebar dragging *
 **********************************************************/

vDrag.on('mousedown pointerdown', function(e){
	vDragGrabbed = true;
	vBarGrab(parseInt(e.clientY));
})

oDrag.on('mousedown pointerdown', function(e){
	oDragGrabbed = true;
	oBarGrab(parseInt(e.clientY));
})

$(document).on('mousemove pointermove', function(e){
	if (vDragGrabbed) {
		vBarMove(parseInt(e.clientY));
		e.preventDefault();
	}
	if (oDragGrabbed) {
		oBarMove(parseInt(e.clientY));
		e.preventDefault();
	}
	if (drawing === true) findxy('move', e.originalEvent);
})

$(document).on('mouseup pointerup', function(e){
	if (vDragGrabbed == true) {
		vDragGrabbed = false;
		vBarRelease();
		e.preventDefault();
	}
	if (oDragGrabbed == true) {
		oDragGrabbed = false;
		oBarRelease();
		e.preventDefault();
	}
	drawing = false;
	//send('sketch');/////////////////////
})

/*****************************************************
 * browser independent sidebar pull up/down handlers *
 *****************************************************/

function vBarGrab(y) {
	if (viewingTile !== undefined) {
		//socket.emit('noView', viewingTile); ////////////////////////
		viewingTile = undefined;
	}
	sidebarGrabbed();
	vBar.css('z-index', '5');
	oBar.css('z-index', '4');
	vybar_start = parseInt(vBar.css('top'));
	vytouchstart = y;
}

function vBarMove(y) {
	var dist = y - vytouchstart;
	var floor = -1 * $('#sidebar_container').height();
	var vy_new = Math.min(0, Math.max(floor, vybar_start + dist));
	vBar.css('top', vy_new + 'px');
}

function vBarRelease() {
	sidebarReleased();
	var y_current = parseInt(vBar.css('top'));
	var threshold = (-1 * $('#sidebar_container').height()) / 2;
	if (y_current < threshold) { //retract sidebar
		vBar.css('top', 'calc(4mm - 100%)');
		canvasImg.css('height', 'calc((100vw - 20mm) / 4 * 3 * 0.9)');
		canvasImg.css('max-width', 'calc((100vw - 20mm) * 0.9)');
		canvas.fadeIn(300);
		canvas0.fadeIn(300);
	}
	else { //sidebar pulled down
		vBar.css('top', '0px');
		var dataURL = canvas0[0].toDataURL(); //TODO: replace with live sketch
		canvasImg.attr('src', dataURL);
		canvasImg.css('height', 'calc((100vw - 32mm) / 4 * 3 * 0.9)');
		canvasImg.css('max-width', 'calc((100vw - 32mm) * 0.9)');
		centerImage(canvasImg);
		cCont.css('width', 'calc(100% - 32mm)');
		tBar.css('display', 'inline-block');
		canvasImg.fadeIn(300);
		fadeInTileBarContents(300);
		
		if (filteredTiles.length !== 0)
			setTimeout(function (){ $('.tile')[0].click(); }, 300);
	}
}

function oBarGrab(y) {
	sidebarGrabbed();
	oBar.css('z-index', '5');
	vBar.css('z-index', '4');
	oybar_start = parseInt(oBar.css('top'));
	oytouchstart = y;
}

function oBarMove(y) {
	var dist = y - oytouchstart;
	var ceiling = $('#sidebar_container').height();
	var oy_new = Math.max(0, Math.min(ceiling, oybar_start + dist));
	oBar.css('top', oy_new + 'px');
}

function oBarRelease() {
	sidebarReleased();
	var y_current = parseInt(oBar.css('top'));
	var threshold = $('#sidebar_container').height() / 2;
	if (y_current > threshold) { //retract sidebar
		oBar.css('top', 'calc(100% - 4mm)');
		canvas.fadeIn(300);
		canvas0.fadeIn(300);
	}
	else { //sidebar pulled up, create image of canvas for saving
		oBar.css('top', '0px');
		var dataURL = canvas0[0].toDataURL();
		canvasImg.attr('src', dataURL);
		centerImage(canvasImg);
		canvasImg.fadeIn(300);
	}
}

//fade out canvas area and show button names
function sidebarGrabbed() {
	canvas.fadeOut(300);
	canvas0.fadeOut(300);
	fadeOutTileBarContents(300);
	canvasImg.fadeOut(300);
	setTimeout(function (){
		cCont.css('width', 'calc(100% - 20mm)');	
		tBar.css('display', 'none');
	}, 300);
	$('.help').each(function(i) { help($(this)); });
}

//fade in canvas area and show button icons
function sidebarReleased() {
	$('.help').each(function(i) { unhelp($(this)); });
}

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
		if(drawing == true) {
			//send('sketch'); ////////////////////
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
	color = $(this).attr('id');
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
		ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
		oldtrack.onload = function (){ctx.drawImage(oldtrack,0,0);}
		if (step == 0){
			$('#btn_undo').css("pointer-events", "none");
		}
	}
	//send('sketch'); ///////////////////
});

$('#btn_redo').click(function(e){
	if (step < trackimage.length-1){
			step++;
			var newtrack = new Image();
			newtrack.src = trackimage[step];
			ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
			newtrack.onload = function() {ctx.drawImage(newtrack,0,0);}
			if (step == trackimage.length-1){
				$('#btn_redo').css("pointer-events", "none");
			$('#btn_undo').css("pointer-events", "auto");
		}
	}
	//send('sketch'); //////////////////
});

$('#btn_save').click(function(e){
	alert('Right-click or touch and hold image on the right to save on your device.')
});

$('#btn_clear').click(function(e){
	if (confirm('This will clear your sketch, are you sure?')) {
		canvasImg.fadeOut(300);
		trackimage = [];
		step = 0;
		ctx.fillStyle = 'white'; //clear canvas
		ctx.fillRect(0, 0, canvas0[0].width, canvas0[0].height);
		ctx.fill();
		var dataURL = canvas0[0].toDataURL(); //clear canvas image
		setTimeout(function (){	canvasImg.attr('src', dataURL); }, 300);
		//send('sketch', ''); ///////////////////////

		canvasImg.fadeIn(300).css('display', 'block');
	}
});

$('#btn_mirror').click(function(e){
	var bar = $('#sidebar_container');
	var addr = bar.css('background-image');
	if (bar.css('float') == 'left') {
		bar.css('float', 'right');
		bar.css('background-image', addr.replace('_left.png','_right.png'));
		tBar.css('float', 'left');
	}
	else {
		bar.css('float', 'left');
		bar.css('background-image', addr.replace('_right.png','_left.png'));		
		tBar.css('float', 'right');
	}
	unhover($(this));
});

$('#btn_post').click(function(e){
	var notes = prompt("This will permanently submit your sketch. Add any notes here:");
	if (notes != null) {
		send('submit', notes);
	}
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
	//socket.emit('updateTribe', tribe); ///////////////////////
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
