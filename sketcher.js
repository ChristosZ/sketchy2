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
var color = 'black';
var brushSize = 6;
var eraserSize = 7;

hover(drawBtn);
$('#size_slider').val((brushSize*10)-1);
canvas0[0].width = canvas0[0].offsetWidth;
canvas0[0].height = canvas0[0].offsetHeight;
ctx.fillStyle = 'white'; //canvas is transparent by default
ctx.fillRect(0, 0, canvas0.width(), canvas0.height());
ctx.fill();

//TODO: fixes & bugs:
//First line takes a while to register?
//draw off page quickly breaks the line
//click and drag off bottom in IE scrolls a bit
//keep drawing when off screen
//IE: pull up options sidebar, then pull down, gets sticky
//make tribe button hoverable
//make sketch tiles clickable and scrollable with buttons
//add vertical scrollbar in view mode and filtering
//center image in view mode

/****************************
 * General display behavior *
 ****************************/

var cCont = $('#canvas_container');
var tBar = $('#tile_controls');
var tCont = $('#tile_container');
var rotateMsg = $('#rotate_screen_msg');

canvas.css('margin-top', Math.max((cCont.height() - cCont.width()*0.75)/2, 0));
rotateMsg.css('margin-top', (cCont.height()-rotateMsg.height())/2);

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

$('.hover').mouseenter(function(e){
	hover($(this));
})

$('.hover').mouseleave(function(e){
	var obj = $(this);
	if (obj.attr('id').substring(4) == mode) hover(obj);
	else unhover(obj);
})

$('.hover').on('mousedown touchstart', function(e){
	var obj = $(this);  
	var addr = obj.css('background-image');
	toggleHover(obj);
})

$('.hover').on('mouseup touchend', function(e){
	var obj = $(this);
	var btn = obj.attr('id').substring(4);
	
	if (btn != 'draw' && btn != 'erase') toggleHover(obj);
	else setMode(obj);

	//canvas.html('Pressed ' + btn + ' button');
})

$('#size_slider').on('pointerup mouseup touchend', function(e){
	var obj = $(this);
	var size = (parseInt(obj.val())+1)/10;
	if (mode == 'erase') eraserSize = size;
	else if (mode == 'draw') brushSize = size;
	
	//canvas.html('Width changed to: ' + size);
});

function hover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_h.png') != -1) return;
	if (addr.indexOf('_c.png') == -1)
		jObj.css('background-image', addr.replace('.png','_c.png'));
}

function unhover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_h.png') != -1) return;
	if (addr.indexOf('_c.png') != -1)
		jObj.css('background-image', addr.replace('_c.png','.png'));
}

function toggleHover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_h.png') != -1) return;
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
	if (addr.indexOf('_c.png') != -1) {
		addr = addr.replace('_c.png','_h.png');
	}
	else {
		if (addr.indexOf('_h.png') == -1) {
		addr = addr.replace('.png','_h.png'); }
	}
	
	jObj.css('background-image', addr);
}

function unhelp (jObj) {
	var addr = jObj.css('background-image');
	jObj.css('background-image', addr.replace('_h.png','.png'));
	
	if (mode == 'draw')
		hover(drawBtn);
	else if (mode == 'erase')
		hover(eraseBtn);
}

function centerImage (jObj) {
	var mTop = Math.max((cCont.height() - jObj.height())/2, cCont.height()*0.05);
	var mLeft = Math.min((cCont.height() - jObj.height())/2, cCont.width()*0.05);
	jObj.css('margin-top', mTop);
	jObj.css('margin-left', mLeft);
}

function addTile (username, tribe, active) {
	if ($('#' + username).length !== 0) $('#' + username).remove();
	
	var tile = $('<div class=tile></div>');
	tile.attr('id', username);
	tCont.append(tile);

	var defaultAddr = tile.css('background-image');
	var newAddr = defaultAddr.substring(0, defaultAddr.length - 14);
	newAddr = newAddr + tribe.substring(0,1) + '_' + ((active) ? 'active' : 'posted') + '.png")';
	tile.css('background-image', newAddr);
}

function removeTile(username) {
	var tile = $('#' + username);
	if (tile.length !== 0) tile.remove();
}

function changeTile (username, tribe, active) {
	var tile = $('#' + username);
	if (tile.length === 0) addTile(username, tribe, active);
	else {
		var oldAddr = tile.css('background-image');
		var newAddr = oldAddr.substring(0, oldAddr.length - 14);
		newAddr = newAddr + tribe.substring(0,1) + '_' + ((active) ? 'active' : 'posted') + '.png")';
		tile.css('background-image', newAddr);
	}
}

function fadeOutTileBarContents (t) {
	$('#btn_up').fadeOut(t);
	$('#btn_down').fadeOut(t);
	tCont.fadeOut(t);
}

function fadeInTileBarContents (t) {
	$('#btn_up').fadeIn(t);
	$('#btn_down').fadeIn(t);
	tCont.fadeIn(t);
}

addTile('user4', 'blue', false);
addTile('user6', 'orange', true);
changeTile('user6', 'gr', false);
changeTile('user7', 'r', true);

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
})

/*****************************************************
 * browser independent sidebar pull up/down handlers *
 *****************************************************/

function vBarGrab(y) {
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
		push();
		drawing = true;
		ctx.beginPath();
		ctx.fillStyle = (mode == 'erase') ? 'white' : color;
		ctx.arc(currX, currY, brushSize/2, 0, 2*Math.PI);
		ctx.fill();
		//TODO: start keeping track of line  
	}
	if (res == 'up' || res == "out") {
		drawing = false;
		//TODO: finalize line, send to server
	}
	if (res == 'move') {
		if (drawing) {
			prevX = currX;
			prevY = currY;
			currX = e.clientX - canvas0[0].offsetLeft;
			currY = e.clientY - canvas0[0].offsetTop;
			draw();
		}
		//TODO: add point to line  
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
	}
	if (step == 0){
		$('#btn_undo').css("pointer-events", "none");
	}
	//TODO: adjust canvas layer visibility, notify server	
});

$('#btn_redo').click(function(e){
	if (step < trackimage.length-1){
			step++;
			var newtrack = new Image();
			newtrack.src = trackimage[step];
			ctx.clearRect(0, 0, canvas0[0].width, canvas0[0].height);
			newtrack.onload = function() {ctx.drawImage(newtrack,0,0);}
	}
	if (step == trackimage.length-1){
		$('#btn_redo').css("pointer-events", "none");
		$('#btn_undo').css("pointer-events", "auto");
	}
	
	//TODO: adjust canvas layer visibility, notify server
	
});

$('#btn_save').click(function(e){
	alert('Right-click or touch and hold image on the right to save on your device.')
});

$('#btn_clear').click(function(e){
	if (confirm('This will clear your sketch, are you sure?')) {
		canvasImg.fadeOut(300);
		
		ctx.fillStyle = 'white'; //clear canvas
		ctx.fillRect(0, 0, canvas0[0].width, canvas0[0].height);
		ctx.fill();
		var dataURL = canvas0[0].toDataURL(); //clear canvas image
		setTimeout(function (){	canvasImg.attr('src', dataURL); }, 300);

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
	
	//TODO: prompt and permanently post picture
	
});

$('#btn_tribes').click(function(e){
	var i = tribes.indexOf(tribe);
	var newTribe = tribes[++i % tribes.length];
	
	$('.btn').each(function(i) {changeTribe($(this), tribe, newTribe)});
	$('.sidebar').each(function(i) {changeTribe($(this), tribe, newTribe)});
	changeTribe($('#rotate_screen'), tribe, newTribe);
	changeTribe($('#rotate_screen_msg'), tribe, newTribe);
	changeTribe($('#small_screen'), tribe, newTribe);
	changeTribe($('#small_screen_msg'), tribe, newTribe);
	
	tribe = newTribe;
});

function changeTribe (obj, oldTribe, newTribe) {
	var oldAddr = obj.css('background-image');
	var newAddr = oldAddr.replace('/img/' + oldTribe + '/', '/img/' + newTribe + '/');
	obj.css('background-image', newAddr);
}

//TODO: sketch viewing functionality

}, false)
