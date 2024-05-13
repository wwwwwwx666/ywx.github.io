// 在画布上设置动画时，最好使用requestAnimationFrame而不是setTimeout或setInterval
// 但并非所有浏览器都支持，有时需要前缀，所以我们需要一个垫片
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 6);
		};
})();

// 现在我们将为演示设置基本变量
var canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d'),
	// 全屏尺寸
	cw = window.innerWidth,
	ch = window.innerHeight,
	// 烟花收藏
	fireworks = [],
	// 粒子收集
	particles = [],
	// 起始色调
	hue = 125,
	// 当一次点击发射焰火时，太多的焰火在没有限制器的情况下一次发射，每5次循环发射一次
	limiterTotal = 5,
	limiterTick = 0,
	// 这将是自动发射烟花的时间，每80圈发射一次(烟花数量)
	timerTotal = 50,
	timerTick = 0,
	mousedown = false,
	// 鼠标x坐标，
	mx,
	// 鼠标y坐标
	my;

// 设置画布尺寸
canvas.width = cw;
canvas.height = ch;

// 现在我们将为整个演示设置函数占位符

// 获取一个范围内的随机数
function random(min, max) {
	return Math.random() * (max - min) + min;
}

// 计算两点之间的距离
function calculateDistance(p1x, p1y, p2x, p2y) {
	var xDistance = p1x - p2x,
		yDistance = p1y - p2y;
	return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// 燃放烟花
function Firework(sx, sy, tx, ty) {
	// 实际坐标
	this.x = sx;
	this.y = sy;
	// 起始坐标
	this.sx = sx;
	this.sy = sy;
	// 目标坐标
	this.tx = tx;
	this.ty = ty;
	// 起点到目标的距离
	this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
	this.distanceTraveled = 0;
	// 跟踪每个焰火的过去坐标以创建轨迹效果，增加坐标计数以创建更突出的轨迹
	this.coordinates = [];
	this.coordinateCount = 3;
	// 用当前坐标填充初始坐标集合
	while (this.coordinateCount--) {
		this.coordinates.push([this.x, this.y]);
	}
	this.angle = Math.atan2(ty - sy, tx - sx);
	this.speed = 2;
	this.acceleration = 1.05;
	this.brightness = random(50, 70);
	// 圆目标指示器半径
	this.targetRadius = 0.5;
}

// 更新烟花
Firework.prototype.update = function(index) {
	// 删除坐标数组中的最后一项
	this.coordinates.pop();
	//将当前坐标添加到数组的开头
	this.coordinates.unshift([this.x, this.y]);

	//循环旋转目标指示器半径
	if (this.targetRadius < 8) {
		this.targetRadius += 0.3;
	} else {
		this.targetRadius = 1;
	}

	// 加快烟花的速度
	this.speed *= this.acceleration;

	// 根据角度和速度获取当前速度
	var vx = Math.cos(this.angle) * this.speed,
		vy = Math.sin(this.angle) * this.speed;
	// 在施加速度的情况下，烟花会传播多远？
	this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

	// 如果移动的距离（包括速度）大于到目标的初始距离，则已到达目标
	if (this.distanceTraveled >= this.distanceToTarget) {
		createParticles(this.tx, this.ty);
		// 移除焰火，使用传递到update函数的索引来确定要移除的
		fireworks.splice(index, 1);
	} else {
		// 未达到目标，继续行驶
		this.x += vx;
		this.y += vy;
	}
}

// 燃放烟花
Firework.prototype.draw = function() {
	ctx.beginPath();
	// 移动到集合中最后一个跟踪的坐标，然后绘制一条到当前x和y的直线
	ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
	ctx.lineTo(this.x, this.y);
	ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
	ctx.stroke();

	ctx.beginPath();
	// 用一个脉冲圆圈画出这个烟花的目标
	ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 0);
	ctx.stroke();
}

// 创建粒子
function Particle(x, y) {
	this.x = x;
	this.y = y;
	// 跟踪每个粒子的过去坐标以创建轨迹效果，增加坐标计数以创建更显著的轨迹
	this.coordinates = [];
	this.coordinateCount = 5;
	while (this.coordinateCount--) {
		this.coordinates.push([this.x, this.y]);
	}
	// 以弧度为单位，在所有可能的方向上设置一个随机角度
	this.angle = random(0, Math.PI * 2);
	this.speed = random(1, 10);
	// 摩擦力会使粒子减速
	this.friction = 0.95;
	// 将应用重力并将粒子向下拉
	this.gravity = 1;
	// 将色调设置为总色调变量的随机数+-50
	this.hue = random(hue - 50, hue + 50);
	this.brightness = random(50, 80);
	this.alpha = 1;
	// 设置粒子淡出的速度
	this.decay = random(0.015, 0.03);
}

// 更新粒子
Particle.prototype.update = function(index) {
	// 删除坐标数组中的最后一项
	this.coordinates.pop();
	// 将当前坐标添加到数组的开头
	this.coordinates.unshift([this.x, this.y]);
	// 减慢粒子的速度
	this.speed *= this.friction;
	// 应用速度
	this.x += Math.cos(this.angle) * this.speed;
	this.y += Math.sin(this.angle) * this.speed + this.gravity;
	// 淡出粒子
	this.alpha -= this.decay;

	// 根据传入的索引，在alpha足够低时移除粒子
	if (this.alpha <= this.decay) {
		particles.splice(index, 1);
	}
}

// 画粒子
Particle.prototype.draw = function() {
	ctx.beginPath();
	// 移动到集合中最后跟踪的坐标，然后绘制一条到当前x和y的线
	ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
	ctx.lineTo(this.x, this.y);
	ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
	ctx.stroke();
}

// 创建粒子群爆炸
function createParticles(x, y) {
	// 增加粒子数以获得更大的爆炸，但要注意增加的粒子对画布性能的影响
	var particleCount = 500;
	while (particleCount--) {
		particles.push(new Particle(x, y));
	}
}

// 主演示循环
function loop() {
	// 此函数将使用requestAnimationFrame无休止地运行
	requestAnimFrame(loop);

	// 随着时间的推移，增加色调以获得不同颜色的焰火
	hue += 1;

	// 创建随机颜色
	hue = random(0, 255);

	// 通常，clearRect（）将用于清除画布
	// 不过，我们希望创建一个拖尾效果
	// 将复合操作设置为destination out将允许我们以特定的不透明度清除画布，而不是将其完全擦除
	ctx.globalCompositeOperation = 'destination-out';
	// 减少alpha特性以创建更突出的轨迹
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect(0, 0, cw, ch);
	// 将复合操作更改回主模式
	// 当焰火和粒子相互重叠时，“打火机”会创建明亮的高光点
	ctx.globalCompositeOperation = 'lighter';

	// 在每个焰火上循环，绘制，更新
	var i = fireworks.length;
	while (i--) {
		fireworks[i].draw();
		fireworks[i].update(i);
	}

	// 在每个粒子上循环，绘制它，更新它
	var i = particles.length;
	while (i--) {
		particles[i].draw();
		particles[i].update(i);
	}

	// 当鼠标未按下时，自动将焰火发射到随机坐标
	if (timerTick >= timerTotal) {
		if (!mousedown) {
			// 在屏幕的底部中间启动焰火，然后设置随机目标坐标，随机y坐标将设置在屏幕上半部分的范围内
			fireworks.push(new Firework(cw / 2, ch, random(0, cw), random(0, ch / 2)));
			timerTick = 0;
		}
	} else {
		timerTick++;
	}

	// 限制鼠标按下时发射烟花的速率
	if (limiterTick >= limiterTotal) {
		if (mousedown) {
			// 在屏幕的中下部启动焰火，然后将当前鼠标坐标设置为目标
			fireworks.push(new Firework(cw / 2, ch, mx, my));
			limiterTick = 0;
		}
	} else {
		limiterTick++;
	}
}

// 窗户装好后，我们就准备好放烟火了！
window.onload = loop;
