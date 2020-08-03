let game = new Phaser.Game(480, 320, Phaser.CANVAS, null, {
  preload: preload, create: create, update: update
});

let ball; // шар
let paddle; // платформа
let bricks; // набор кирпичей
let newBrick; // новый крипич
let brickInfo; // храним инфо о кирпичах

let score = 0; // количество очков
let scoreText; // надпись с количеством набранных очков

let lives = 3; // количество жизней
let livesText; // надпись с количеством оставшихся жизней
let lifeLostText; // надпись, после потери жизни

let playing = false;
let startButton;

function preload() {
  // масштабирование под разный размер:
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.stage.backgroundColor = '#eee'; // фон  
  game.load.image('paddle', 'img/paddle.png'); // загружаем картинку платформы
  game.load.image('brick', 'img/brick.png'); // загружаем картинку кирпича
  game.load.spritesheet('ball', 'img/wobble.png', 20, 20); // загружаем картинку сплющенного шара
  game.load.spritesheet('button', 'img/button.png', 120, 40); // загружаем карттнку кнопки старт
}

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE); // добавляем физику Arcade Physics
  game.physics.arcade.checkCollision.down = false; // убираем столкновение с нижней границей экрана

  // шар:
  ball = game.add.sprite(game.world.width * 0.5, game.world.height - 25, 'ball'); // показываем шар и устанавливаем начальное положение шара - по центру 
  ball.animations.add('wobble', [0, 1, 0, 2, 0, 1, 0, 2, 0], 24);
  ball.anchor.set(0.5); // разместили посередине
  game.physics.enable(ball, Phaser.Physics.ARCADE); // добавляем шар в физическую систему
  ball.body.collideWorldBounds = true; // появляются границы
  ball.body.bounce.set(1); // отскок от границ  

  //game over, в случае вылета за нижнюю границу:
  ball.checkWorldBounds = true;
  ball.events.onOutOfBounds.add(ballLeaveScreen, this);

  // платформа:
  paddle = game.add.sprite(game.world.width * 0.5, game.world.height - 5, 'paddle'); // показываем платформу
  paddle.anchor.set(0.5, 1); // разместили посередине
  game.physics.enable(paddle, Phaser.Physics.ARCADE); // добавляем платформу в физическую систему
  paddle.body.immovable = true; // делаем платформу неподвижной после удара шара

  initBricks();

  // надписи:
  textStyle = { font: '18px Arial', fill: '#0095DD' }; // стиль текста
  scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
  livesText = game.add.text(game.world.width - 5, 5, 'Lives: ' + lives, textStyle);
  livesText.anchor.set(1, 0);
  lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, 'Life lost, click to continue', textStyle);
  lifeLostText.anchor.set(0.5);
  lifeLostText.visible = false;

  // кнопка старта:
  startButton = game.add.button(game.world.width * 0.5, game.world.height * 0.5, 'button', startGame, this, 1, 0, 2);
  startButton.anchor.set(0.5);
}

function update() {
  game.physics.arcade.collide(ball, paddle); // проверка столкновения платформы и шара
  paddle.x = game.input.x || game.world.width * 0.5; // добавляем управление мышкой и устанавливаем начальное положение платформы - по центру 

  // столкновение с кирпичем:
  game.physics.arcade.collide(ball, paddle, ballHitPaddle);
  game.physics.arcade.collide(ball, bricks, ballHitBrick);
  if (playing) {
    paddle.x = game.input.x || game.world.width * 0.5;
  }
}

function initBricks() { // функция отрисовки кирпичей
  brickInfo = {
    width: 50,
    height: 20,
    count: {
      row: 3,
      col: 7
    },
    offset: {
      top: 50,
      left: 60
    },
    padding: 10
  };

  bricks = game.add.group();
  for (c = 0; c < brickInfo.count.col; c++) {
    for (r = 0; r < brickInfo.count.row; r++) {
      let brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;;
      let brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
      newBrick = game.add.sprite(brickX, brickY, 'brick');
      game.physics.enable(newBrick, Phaser.Physics.ARCADE);
      newBrick.body.immovable = true;
      newBrick.anchor.set(0.5);
      bricks.add(newBrick);
    }
  }
}

function ballHitBrick(ball, brick) {
  // добавляем двойника для плавного исчезновения кирпича:
  let killTween = game.add.tween(brick.scale);
  killTween.to({ x: 0, y: 0 }, 200, Phaser.Easing.Linear.None);
  killTween.onComplete.addOnce(function () {
    brick.kill();
  }, this);
  killTween.start();

  // обновляем очки при попадании шара в кирпич:
  score += 10;
  scoreText.setText('Points: ' + score);

  // условие для победы:
  if (score === brickInfo.count.row * brickInfo.count.col * 10) {
    alert('You won the game, congratulations!');
    location.reload();
  }
}

function ballLeaveScreen() { // уменьшаем количество жизней каждый раз, когда шар выходит за нижнюю границу
  lives--;
  if (lives) {
    livesText.setText('Lives: ' + lives);
    lifeLostText.visible = true;
    ball.reset(game.world.width * 0.5, game.world.height - 25);
    paddle.reset(game.world.width * 0.5, game.world.height - 5);
    game.input.onDown.addOnce(function () {
      lifeLostText.visible = false;
      ball.body.velocity.set(150, -150);
    }, this);
  }
  else {
    alert('You lost, game over!');
    location.reload();
  }
}

function ballHitPaddle(ball, paddle) {
  ball.animations.play('wobble');
  ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x);
}

function startGame() { // игра начинается после нажатия на кнопку старт
  startButton.destroy();
  ball.body.velocity.set(150, -150);
  playing = true;
}
