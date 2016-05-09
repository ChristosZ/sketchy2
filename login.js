window.addEventListener('load', function(){
/*
var socket = io.connect();
socket.emit('createRoom', 'test', 'user', 'blue');

socket.on('addRoom', function(name, tribe, sketching, submitted) {
	var room = [tribe, name, sketching, submitted];
	rooms.push(room);
	  
	document.getElementById('roomlist').innerHTML = '';
	for (i = 0; i < rooms.length; i++) { 
			var newli = document.createElement('li');
			newli.innerHTML = "<img src = 'img/common/tribe_" + rooms[i][0][0] + ".png' width = '20px' height = '20px' id = 'bullets'><p class = 'roomname_field'>" + rooms[i][1] + "</p><p class = 'num_sketch'>" + rooms[i][2] + "</p><p class = 'num_upload'>" + rooms[i][3] + "</p>";
			document.getElementById('roomlist').appendChild(newli);
	}

});

socket.on('updateRoom', function(name, tribe) {
	//find the room in the list and update the tribe
});

socket.on('rmRoom', function(name) {
	//find the room in the list, and remove it
});

socket.on('alert', function (string) {
	//send an alert or show a message for username taken or room name taken
});

socket.on('redirect', function(data){
	//redirect the page to the sketcher
	//window.location
});
*/

var firstPage = $('#first_page');
var joinPage = $('#join_page');
var hostPage = $('#host_page');
var jRooms = $('#room_container');
var rooms = [['blue', 'eeee', '20', '20'], ['yellow', 'eedd', '20', '30'], ['pink', 'cccc', '30', '40'], ['orange', 'bbbb', '40', '50'], ['green', 'aaaa', '50', '60']];
var userrooms = rooms;
var tribes = ['blue', 'green', 'yellow', 'orange', 'red', 'purple']
var tribe = 'blue';
var textColors = [];
var tribe_sort = true;
var name_sort = true;
var active_sort = true;
var post_sort = true;
textColors['blue'] = 'rgb(43,87,153)';
textColors['green'] = 'rgb(84,131,59)';
textColors['yellow'] = 'rgb(191,147,45)';
textColors['orange'] = 'rgb(198,93,40)';
textColors['red'] = 'rgb(219,54,39)';
textColors['purple'] = 'rgb(175,96,166)';

refreshRooms();
$('#posted_sort').css('margin-right', getScrollBarWidth() + 'px');
$('#roomname_sort').css('width','calc(100% - 32mm - ' + getScrollBarWidth() + 'px)');

$(window).resize(function () {
	var t = $('#first_page .nav_container');
	t.css('line-height', t.height()/2 + 'px');
});

function addRoomRow (arrayIndex) {
	var tribe = userrooms[arrayIndex][0][0];
	var roomname = userrooms[arrayIndex][1];
	var active = userrooms[arrayIndex][2];
	var posted = userrooms[arrayIndex][3];
	
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
	/* //add clickability
	room.click(function(e){
		var username = $(this).attr('id');
		if (getTileIndex(username) === -1) {
			refreshTiles();
			return;
		}
		if (!showingCanvas()) {
			canvasImg.fadeOut(300);
			canvasImg.attr('src', canvas0[0].toDataURL());
			canvasImg.fadeIn(300);
		}
	});
	*/
	jRooms.append(room);
	var bullet = $('#' + roomname + ' .bullet');
	var bulletImgAddr = bullet.css('background-image');
	bullet.css('background-image',bulletImgAddr.replace('b.png',tribe[0]+'.png'));
}

function refreshRooms () {
	jRooms.empty();
	for (i = 0; i < userrooms.length; i++) addRoomRow(i);
}

$('#btn_tribe_sort').click(function () {
	userrooms.sort(function(a,b) { return a[0].localeCompare(b[0]); });
	tribe_sort = !tribe_sort;
	if (tribe_sort == true){
		userrooms.reverse();
	}
	refreshRooms();
});

$('#roomname_sort').click(function () {
	userrooms.sort(function(a,b) { return a[1].localeCompare(b[1]); });
	name_sort = !name_sort;
	if (name_sort == true){
		userrooms.reverse();
	}
	refreshRooms();
});

$('#active_sort').click(function () {
	userrooms.sort(function(a,b) { return a[2].localeCompare(b[2]); });
	active_sort = !active_sort;
	if (active_sort == true){
		userrooms.reverse();
	}
	refreshRooms();
});

$('#posted_sort').click(function () {
	userrooms.sort(function(a,b) { return a[3].localeCompare(b[3]); });
	post_sort = !post_sort;
	if (post_sort == true){
		userrooms.reverse();
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
		userrooms = rooms;
		refreshRooms();
	}
	else {
		jRooms.empty();
		userrooms = [];
		var trackuser = 0;
		for (i = 0; i < rooms.length; i++)
			if (rooms[i][1].indexOf(searchRoom) != -1) {
				userrooms.push(rooms[i]);
				addRoomRow(trackuser);
				trackuser++;
			}
   	}
});

$('#search_text').keydown(function (e) {
	if (e.originalEvent.keyCode == 13) $('#btn_search').click();
});

$('.go_join').click(function () {
	firstPage.hide();
	hostPage.hide();
	joinPage.show();
	num = 0;
});

$('.go_host').click(function () {
	firstPage.hide();
	joinPage.hide();
	hostPage.show();
	num = 0;
});

illegalkey = ['!','@','#','$','%','^','&','*','(',')','_','-','=','+',
				'[','{',']','}',';',':','\'','\"',',','<','.','>','/','?'];
$('input').keyup(function(e){
	var userinput = $(this)[0].value;
	if (illegalkey.indexOf(userinput[userinput.length-1]) != -1)
		$(this)[0].value = $(this)[0].value.slice(0,-1);
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

//function taken from stack overflow
function getScrollBarWidth () {
	var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body');
	var widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
	$outer.remove();
	return (100 - widthWithScroll);
};

}, false)