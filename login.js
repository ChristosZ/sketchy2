window.addEventListener('load', function(){
/*
var socket = io.connect();
//socket.emit('createRoom', 'test', 'user', 'blue');

socket.on('addRoom', function (roomname, tribe, active, posted) {
	addRoom(roomname, tribe, active, posted);
});

socket.on('updateRoom', function (roomname, tribe, active, posted) {
	updateRoom(roomname, tribe, active, posted);
});

socket.on('removeRoom', function (roomname) {
	removeRoom(roomname);
});

socket.on('alert', function (string) {
	//username or room name taken
	alert(string);
});

socket.on('redirect', function (data){
	//redirect the page to the sketcher
	//window.location
});
*/

var firstPage = $('#first_page');
var joinPage = $('#join_page');
var hostPage = $('#host_page');
var jRooms = $('#room_container');
var rooms = [];
var roomsInView = rooms;
var tribes = ['blue', 'green', 'yellow', 'orange', 'red', 'purple']
var tribe = 'blue';
var textColors = [];
var tribe_sort = true;
var name_sort = true;
var active_sort = true;
var post_sort = true;
var view = 'first page';
var roomnameClicked = undefined;
textColors['blue'] = 'rgb(43,87,153)';
textColors['green'] = 'rgb(84,131,59)';
textColors['yellow'] = 'rgb(191,147,45)';
textColors['orange'] = 'rgb(198,93,40)';
textColors['red'] = 'rgb(219,54,39)';
textColors['purple'] = 'rgb(175,96,166)';

refreshRooms();
$('#posted_sort').css('margin-right', getScrollBarWidth() + 'px');
$('#roomname_sort').css('width','calc(100% - 32mm - ' + getScrollBarWidth() + 'px)');

//test values
addRoom('eeee', 'blue', '1', '80');
addRoom('eedd', 'yellow', '40', '30');
addRoom('cccc', 'pink', '30', '47');
addRoom('bbbb', 'orange', '23', '25');
addRoom('aaaa', 'green', '50', '61');

$(window).resize(function () {
	var t = $('#first_page .nav_container');
	t.css('line-height', t.height()/2 + 'px');
});

function addRoomRow (arrayIndex) {
	var tribe = roomsInView[arrayIndex][0][0];
	var roomname = roomsInView[arrayIndex][1];
	var active = roomsInView[arrayIndex][2];
	var posted = roomsInView[arrayIndex][3];
	
	var html = 	"<div class=room><div class=bullet>"
				+ "</div><div class='roomname_field'>" + roomname
				+ "</div><div class='num_active'>" + active
				+ "</div><div class='num_posted'>" + posted
				+ "</div></div>";
	
	var room = $(html);
	room.attr('id', roomname);
	room.hover(function () {
		$(this).css('background-image', $('.head_bar').css('background-image')); },
		function () { $(this).css('background-image','');
	});
	
	room.click(function(e){
		roomnameClicked = $(this).attr('id');
		if (confirm("Would you like to join the room '" + roomnameClicked + "'?")) {
			//TODO: socket call check username and go to room!
		}
	});
	
	jRooms.append(room);
	var bullet = $('#' + roomname + ' .bullet');
	var bulletImgAddr = bullet.css('background-image');
	bullet.css('background-image',bulletImgAddr.replace('b.png',tribe[0]+'.png'));
}

function refreshRooms () {
	jRooms.empty();
	for (i = 0; i < roomsInView.length; i++) addRoomRow(i);
}

$('.hover').mouseenter(function(e){ hover($(this)); })
$('.hover').mouseleave(function(e){ unhover($(this)); })

$('.hover').on('mousedown touchstart', function(e){
	var obj = $(this);  
	var addr = obj.css('background-image');
	toggleHover(obj);
})

$('.hover').on('mouseup touchend', function(e){
	var obj = $(this);
	var id = obj.attr('id').substring(4,8);
	if (id != 'host' && id != 'join') toggleHover(obj);
})

$('.go_join').click(function () {
	firstPage.hide();
	hostPage.hide();
	joinPage.show();
	view = 'join';
	$('.go_join .go_btn').each(function () {hover($(this))});
	$('.go_host .go_btn').each(function () {unhover($(this))});
});

$('.go_host').click(function () {
	firstPage.hide();
	joinPage.hide();
	hostPage.show();
	view = 'host';
	$('.go_host .go_btn').each(function () {hover($(this))});
	$('.go_join .go_btn').each(function () {unhover($(this))});
});

$('.go_join').mouseenter(function(e){ hover($('.go_join .go_btn')); });
$('.go_join').mouseleave(function(e){ unhover($('.go_join .go_btn')); });
$('.go_join').on('mousedown touchstart mouseup touchend', function(e){
	$('.go_join .go_btn').each(function () { toggleHover($(this)); });
});

$('.go_host').mouseenter(function(e){ hover($('.go_host .go_btn')); });
$('.go_host').mouseleave(function(e){ unhover($('.go_host .go_btn')); });
$('.go_host').on('mousedown touchstart mouseup touchend', function(e){
	$('.go_host .go_btn').each(function () { toggleHover($(this)); });
});

$('#public_text').click(function () { $('#go_public').click(); });
$('#public_text').mouseenter(function(e){ hover($('#go_public')); });
$('#public_text').mouseleave(function(e){ unhover($('#go_public')); });
$('#public_text').on('mousedown touchstart mouseup touchend', function(e){ toggleHover($('#go_public')); });

$('#private_text').click(function () { $('#go_private').click(); });
$('#private_text').mouseenter(function(e){ hover($('#go_private')); });
$('#private_text').mouseleave(function(e){ unhover($('#go_private')); });
$('#private_text').on('mousedown touchstart mouseup touchend', function(e){	toggleHover($('#go_private')); });


$('#btn_tribe_sort').click(function () {
	roomsInView.sort(function(a,b) { return a[0].localeCompare(b[0]); });
	tribe_sort = !tribe_sort;
	if (tribe_sort == true){
		roomsInView.reverse();
	}
	refreshRooms();
});

$('#roomname_sort').click(function () {
	roomsInView.sort(function(a,b) { return a[1].localeCompare(b[1]); });
	name_sort = !name_sort;
	if (name_sort == true){
		roomsInView.reverse();
	}
	refreshRooms();
});

$('#active_sort').click(function () {
	roomsInView.sort(function(a,b) { return a[2].localeCompare(b[2]); });
	active_sort = !active_sort;
	if (active_sort == true){
		roomsInView.reverse();
	}
	refreshRooms();
});

$('#posted_sort').click(function () {
	roomsInView.sort(function(a,b) { return a[3].localeCompare(b[3]); });
	post_sort = !post_sort;
	if (post_sort == true){
		roomsInView.reverse();
	}
	refreshRooms();
});

$('#btn_search').click(function () {
	tribe_sort = true;
	name_sort = true;
	active_sort = true;
	post_sort = true;
	var searchRoom = $('#search_text')[0].value;

	if (searchRoom == '') {
		roomsInView = rooms;
		refreshRooms();
	}
	else {
		jRooms.empty();
		roomsInView = [];
		var trackuser = 0;
		for (i = 0; i < rooms.length; i++)
			if (rooms[i][1].indexOf(searchRoom) != -1) {
				roomsInView.push(rooms[i]);
				addRoomRow(trackuser);
				trackuser++;
			}
	}
});

$('#search_text').keydown(function (e) {
	if (e.originalEvent.keyCode == 13) $('#btn_search').click();
});

var trackusername = '';
$('#nickname').keyup(function(event){
	var f = $(this);
	if (/^([a-z0-9A-Z]*)$/.test(f.val()) == false) f.val(trackusername);
	else {
		trackusername = f.val();
		$('#nickname2').val(f.val());
	}
});
$('#nickname2').keyup(function(event){
	var f = $(this);
	if (/^([a-z0-9A-Z]*)$/.test(f.val()) == false) f.val(trackusername);
	else {
		trackusername = f.val();
		$('#nickname').val(f.val());
	}
});

var trackroomname = '';
$('#roomname').keyup(function(event){
	var f = $(this);
	if (/^([a-z0-9A-Z]*)$/.test(f.val()) == false) f.val(trackroomname);
	else trackroomname = f.val();
});

$('#btn_tribe').click(function(e){ toggleTribe(); });
$('#btn_tribe_2').click(function(e){ toggleTribe(); });
$('#logo').click(function(e){ toggleTribe(); });

function toggleTribe () {
	var i = tribes.indexOf(tribe);
	var newTribe = tribes[++i % tribes.length];
	
	$('body').css('color', textColors[newTribe]);
	$('.btn').each(function(i) {changeTribe($(this), tribe, newTribe)});
	$('.sidebar').each(function(i) {changeTribe($(this), tribe, newTribe)});
	changeTribe($('.head_bar'), tribe, newTribe);
	changeTribe($('#first_page'), tribe, newTribe);
	changeTribe($('#rotate_screen'), tribe, newTribe);
	changeTribe($('#rotate_screen_msg'), tribe, newTribe);
	changeTribe($('#small_screen'), tribe, newTribe);
	changeTribe($('#small_screen_msg'), tribe, newTribe);
	changeTribe($('#active_sort'), tribe, newTribe);
	changeTribe($('#posted_sort'), tribe, newTribe);
	
	tribe = newTribe;
}

function changeTribe (obj, oldTribe, newTribe) {
	var oldAddr = obj.css('background-image');
	
	if (oldAddr.indexOf('/common/tile_') != -1)
		var newAddr = oldAddr.replace('img/common/tile_' + oldTribe[0],'img/common/tile_' + newTribe[0]);
	else
		var newAddr = oldAddr.replace('img/' + oldTribe + '/', 'img/' + newTribe + '/');
	
	obj.css('background-image', newAddr);
}

function hover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_c.png') == -1)
		jObj.css('background-image', addr.replace('.png','_c.png'));
}

function unhover (jObj) {
	var id = jObj.attr('id').substring(4,8);
	var addr = jObj.css('background-image');
	if (id == view) hover(jObj);
	else {
		if (addr.indexOf('_c.png') != -1)
			jObj.css('background-image', addr.replace('_c.png','.png'));
	}
}

function toggleHover (jObj) {
	var addr = jObj.css('background-image');
	if (addr.indexOf('_c.png') != -1)
		jObj.css('background-image', addr.replace('_c.png','.png'));
	else
		jObj.css('background-image', addr.replace('.png','_c.png'));
}

//function taken from stack overflow
function getScrollBarWidth () {
	var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body');
	var widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
	$outer.remove();
	return (100 - widthWithScroll);
};

function addRoom (roomname, tribe, active, posted) {
	for (i = 0; i < rooms.length; i++) {
		if (rooms[i][1] == roomname) {
			updateRoom(roomname, tribe, active, posted);
			return;
		}
	}
	var room = [tribe, roomname, active, posted];
	rooms.push(room);
	if (rooms.length !== roomsInView.length) roomsInView.push(room);

	refreshRooms();
}

function updateRoom (roomname, tribe, active, posted) {
	var oldTribe = undefined;
	for (i = 0; i < rooms.length; i++) {
		if (rooms[i][1] == roomname) {
			oldTribe = rooms[i][0];
			rooms[i][0] = tribe;
			rooms[i][2] = active;
			rooms[i][3] = posted;
			break;
		}
	}
	if (oldTribe === undefined) addRoom (roomname, tribe, active, posted);
	
	for (i = 0; i < roomsInView.length; i++) {
		if (roomsInView[i][1] == roomname) {
			roomsInView[i][0] = tribe;
			roomsInView[i][2] = active;
			roomsInView[i][3] = posted;
			break;
		}
	}
	//if currently listed, change bullet color and numbers	
	if (oldTribe !== undefined && $('.room#' + roomname).length !== 0) {
		$('#' + roomname + ' .num_active').text(active);
		$('#' + roomname + ' .num_posted').text(posted);
		
		var bullet = $('#' + roomname + ' .bullet');
		var bulletImgAddr = bullet.css('background-image');
		bullet.css('background-image',bulletImgAddr.replace(oldTribe[0]+'.png',tribe[0]+'.png'));
	}
}

function removeRoom(roomname) {
	for (i = 0; i < rooms.length; i++) {
		if (rooms[i][1] == roomname) {
			rooms.splice(i,1);
			break;
		}
	}
	for (i = 0; i < roomsInView.length; i++) {
		if (roomsInView[i][1] == roomname) {
			roomsInView.splice(i,1);
			break;
		}
	}
	$('.room#' + roomname).remove();
}

}, false)