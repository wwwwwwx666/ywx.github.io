$(function(){
	musicPlay();
})

/* 音频控制器 （防止chrome浏览器等不支持默认播放）*/
if ($("#one").paused) {
	alert($("#one").paused)
	//播放
	$("#one").play();
}

/* 音乐的列表播放 */
var audio = $("audio");
for (var i = 0; i < audio.length; i++) {
	audio[i].addEventListener('ended', function() {
		var nextStep = this.nextSibling.nextSibling;
		if (nextStep.tagName == "AUDIO") {
			nextStep.play();
		}
	}, false);
}


/* 保险措施，确保自动加载页面时，无法播放音乐；可点击  “大老师”进行音乐播放 */
function musicPlay() {
	var player = document.getElementById('one');
	setTimeout(() => {
	    player.play();
	}, 10 );
	player.play();
	if (player.played) {
		// 如果正在播放, 停止播放并停止读取此音乐文件
		player.pause();
		//player.src = '';
	} else {
		player.src = 'songs/周杰伦%20-%20七里香（钢琴版）.mp3';
		player.play();
	}

	/* 音频控制器 （防止chrome浏览器等不支持默认播放）*/
	if ($("#one").paused) {
		alert($("#one").paused)
		//播放
		$("#one").play();
	}

	/* 音乐的列表播放 */
	var audio = $("audio");
	for (var i = 0; i < audio.length; i++) {
		audio[i].addEventListener('ended', function() {
			var nextStep = this.nextSibling.nextSibling;
			if (nextStep.tagName == "AUDIO") {
				nextStep.play();
			}
		}, false);
	}
}
