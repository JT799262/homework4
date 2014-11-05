$(function() {
  var Q = window.Q = Quintus({ audioSupported: ['wav', 'mp3', 'ogg'] })
                     .include('Input, Sprites, Scenes, Audio, UI, Touch')
                     .setup({ height: 500 })
					 .touch()
					 .enableSound();

  Q.input.mouseControls();
  Q.input.keyboardControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
  });

  Q.Paddle = Q.Sprite.extend("Paddle", {
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
		lives: 3,
      });
      this.p.x = Q.width/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 30) { 
        this.p.x = 30;
      } else if(this.p.x > Q.width - 30) { 
        this.p.x = Q.width - 30;
      }
    }
  });

  Q.Ball = Q.Sprite.extend("Ball", {
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
		score: 0,
		lives: 3,
      });
      this.p.y = (Q.height / 2 - this.p.h) +15
      this.p.x = Q.width / 2 + this.p.w / 2;
    
	this.on('hit', this, 'collision');

  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite

		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 10) { 
			p.x = 10;
			p.dx = 1;
			Q.audio.play('powerdown.wav');
		  } else if(p.x > Q.width - p.w) { 
			p.dx = -1;
			p.x = Q.width - p.w;
			Q.audio.play('powerdown.wav');
		  }

		  if(p.y < 10) {
			p.y = 10;
			p.dy = 1;
			Q.audio.play('powerdown.wav');
		  } else if(p.y > Q.height - 10) {
				
				this.p.lives = this.p.lives -1;
				var livesLabel = Q("UI.Text", 3).items[1];
			
				if(this.p.lives == 0) {
					livesLabel.p.label = "Lives: " + this.p.lives;
					Q.stageScene('loseScreen');
				}
				else {
					livesLabel.p.label = "Lives: " + this.p.lives;
					this.p.y = (Q.height / 2 - this.p.h) +15
					this.p.x = Q.width / 2 + this.p.w / 2;
					this.p.dx = 1;
					this.p.dy = -1;
				}
			}
	  });
    },
	
		collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
			Q.audio.play('hit.wav');
			this.p.dy = -1;
		} else if (col.obj.isA("Block")) {
			Q.audio.play('brickDeath.wav');
			col.obj.destroy();
			this.p.dy *= -1;
			this.p.score = (this.p.score + 100);
			var scoreLabel = Q("UI.Text", 3).items[0];
			scoreLabel.p.label = "Score: " + this.p.score;
			Q.stage().trigger('removeBlock');
		}
	}
  });

  Q.Block = Q.Sprite.extend("Block", {
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.on('collision',function(ball) {
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });
  
Q.scene('title',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width /2, y: Q.height-400
  }));

  var label = container.insert(new Q.UI.Text({x:0, y: 0,
    label: "Block Break", color: "blue" }));
	
var button = container.insert(new Q.UI.Button({ x: 0, y: 50, fill: "#CCCCCC",
                                                  label: "Play Game" }))    

var label = container.insert(new Q.UI.Text({x:0, y: 100, size: 16,
    label: "Controls", color: "white" }));

var label = container.insert(new Q.UI.Text({x:5, y: 140, size: 13,
    label: "Left arrow key moves paddle left.", color: "white" }));	
	
var label = container.insert(new Q.UI.Text({x:5, y: 190, size: 13,
    label: "Right arrow key moves paddle right.", color: "white" }));	
 
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('game');
	Q.stageScene('hud', 3);
  });

  container.fit(20);
});  
  
Q.scene('game',new Q.Scene(function(stage) {
		Q.stageScene('hud', 3);
      stage.insert(new Q.Paddle());
      stage.insert(new Q.Ball());

      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=0;y<5;y++) {
          stage.insert(new Q.Block({ x: x*50+35, y: y*30+50}));
          blockCount++;
        }
      }
      stage.on('removeBlock',function() {
        blockCount--;
        if(blockCount == 0) {
          Q.stageScene('winScreen');
        }
      });

    }));


Q.scene('winScreen',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width /2, y: Q.height /2
  }));

  var label = container.insert(new Q.UI.Text({x:0, y: 0,
    label: "You won the Game.", color: "white" }));
	
var button = container.insert(new Q.UI.Button({ x: 0, y: 50, fill: "#CCCCCC",
                                                  label: "Play Again" }))         
 
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('game');
	Q.stageScene('hud', 3);
  });

  container.fit(20);
});


Q.scene('loseScreen',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width /2, y: Q.height /2
  }));

  var label = container.insert(new Q.UI.Text({x:0, y: 0,
    label: "You lost the Game.", color: "white" }));
	
var button = container.insert(new Q.UI.Button({ x: 0, y: 50, fill: "#CCCCCC",
                                                  label: "Play Again" }))         
 
  // When the button is clicked, clear all the stages
  // and restart the game.
  button.on("click",function() {
    Q.clearStages();
    Q.stageScene('game');
	Q.stageScene('hud', 3);
  });

  container.fit(20, 20);
});	
	
	
Q.scene('hud',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: 20, y: 0
  }));

  var scoreLabel = container.insert(new Q.UI.Text({x:50, y: 15, size: 14,
    label: "Score: 0", color: "white" }));
	
var livesLabel = container.insert(new Q.UI.Text({x:150, y: 15, size: 14,
    label: "Lives: 3", color: "white" }));	

  container.fit(2);
});	
	

  Q.load(['blockbreak.png','blockbreak.json', 'powerdown.wav', 'hit.wav', 'brickDeath.wav'], function() {
    Q.compileSheets('blockbreak.png','blockbreak.json');  
	Q.sheet("ball", "blockbreak.png", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak.png", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak.png", { tilew: 60, tileh: 20, sy: 40, sx: 0 });		 		 
    Q.stageScene('title');
  });  
});