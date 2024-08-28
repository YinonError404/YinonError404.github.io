document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const countdownElement = document.getElementById('timer');
    const restartButton = document.getElementById('reload');
    const volumeSlider = document.getElementById('volumeSlider');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const sliceSound = new Audio('slice.wav');

    let time = 60;
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let fruits = [];
    const fruitImages = ['appl.png', 'banana.png', 'strawberry.png'];

    // הגדרת עוצמת הקול ההתחלתית
    backgroundMusic.volume = volumeSlider.value;

    // עדכון עוצמת הקול כאשר משנים את המכוון
    volumeSlider.addEventListener('input', (event) => {
        backgroundMusic.volume = event.target.value;
    });

    // ניגון המוזיקה
    backgroundMusic.play().catch((error) => {
        console.error('Error playing music:', error);
    });

    // קביעת גודל הקנבס
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    // טעינת תמונת הרקע
    const backgroundImage = new Image();
    backgroundImage.src = 'bg.png';

    // פונקציה לציור רקע
    function drawBackground() {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    // מחלקת פרי
    class Fruit {
        constructor(imageSrc, x, y, width, height, speed) {
            this.image = new Image();
            this.image.src = imageSrc;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.speed = speed;
            this.isSliced = false;
            this.sliceParts = []; // יאחסן את החצאים לאחר החיתוך
        }

        draw() {
            if (!this.isSliced) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {
                this.sliceParts.forEach(part => {
                    ctx.save();
                    ctx.translate(part.x + part.width / 2, part.y + part.height / 2);
                    ctx.rotate(part.rotation);
                    ctx.drawImage(
                        this.image,
                        part.sx, part.sy, part.sWidth, part.sHeight,
                        -part.width / 2, -part.height / 2,
                        part.width, part.height
                    );
                    ctx.restore();
                });
            }
        }

        update() {
            if (!this.isSliced) {
                this.y += this.speed;
            } else {
                this.sliceParts.forEach(part => {
                    part.x += part.vx;
                    part.y += part.vy;
                    part.vy += 0.05; // אפקט גרביטציה
                    part.rotation += part.vr;
                });
            }
        }

        slice() {
            this.isSliced = true;
            // חצי שמאלי
            const leftPart = {
                x: this.x,
                y: this.y,
                width: this.width / 2,
                height: this.height,
                sx: 0,
                sy: 0,
                sWidth: this.image.width / 2,
                sHeight: this.image.height,
                vx: -2,
                vy: -2,
                vr: -0.05,
                rotation: -0.5
            };
            // חצי ימני
            const rightPart = {
                x: this.x + this.width / 2,
                y: this.y,
                width: this.width / 2,
                height: this.height,
                sx: this.image.width / 2,
                sy: 0,
                sWidth: this.image.width / 2,
                sHeight: this.image.height,
                vx: 2,
                vy: -2,
                vr: 0.05,
                rotation: 0.5
            };
            this.sliceParts.push(leftPart, rightPart);
        }

        isClicked(mouseX, mouseY) {
            return (
                mouseX >= this.x &&
                mouseX <= this.x + this.width &&
                mouseY >= this.y &&
                mouseY <= this.y + this.height
            );
        }

        isOutOfScreen() {
            if (!this.isSliced) {
                return this.y > canvas.height;
            } else {
                return this.sliceParts.every(
                    part => part.y > canvas.height || part.x + part.width < 0 || part.x > canvas.width
                );
            }
        }
    }

    // פונקציה ליצירת פרי חדש
    function spawnFruit() {
        if (time > 0) {
            const x = Math.random() * (canvas.width - 50);
            const speed = 2 + Math.random() * 3;
            const imageSrc = fruitImages[Math.floor(Math.random() * fruitImages.length)];
            const fruit = new Fruit(imageSrc, x, -80, 80, 80, speed); // יתחילו מחוץ למסך מלמעלה
            fruits.push(fruit);
        }
    }
    

    // אירוע לחיתוך פרי
    canvas.addEventListener('mousedown', function(event) {
        if (time > 0) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            fruits.forEach((fruit, index) => {
                if (fruit.isClicked(mouseX, mouseY) && !fruit.isSliced) {
                    fruit.slice();
                    sliceSound.play();
                    score++;
                    scoreElement.textContent = "Score: " + score;
                }
            });
        }
    });

    // פונקציה לציור הודעת "Game Over" והציון הסופי
    function drawGameOver() {
        ctx.font = '80px Arial';
        ctx.fillStyle = '#7492af';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 100);
        ctx.fillText('Your score is: ' + score, canvas.width / 2, canvas.height / 2);
        ctx.fillText('Your best score is: ' + highScore, canvas.width / 2, canvas.height / 2 + 100);
        restartButton.style.display = 'block';
    }

    function timeOut() {
        time--;
        countdownElement.textContent = 'Time Left: ' + time;
        if (time > 0) {
            setTimeout(timeOut, 1000);
        } else {
            countdownElement.textContent = 'Game Over!';
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
            backgroundMusic.pause();
            drawGameOver();
        }
    }

    // התחל את הספירה לאחור
    timeOut();

    // לולאת המשחק
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();

        if (time > 0) {
            fruits.forEach((fruit, index) => {
                fruit.update();
                fruit.draw();

                if (fruit.isOutOfScreen()) {
                    fruits.splice(index, 1);
                    if (!fruit.isSliced) {
                        score = Math.max(score - 1,);
                        scoreElement.textContent = "Score: " + score;
                    }
                }
            });
        } else {
            drawGameOver();
        }

        requestAnimationFrame(gameLoop);
    }

    // התחלת לולאת המשחק
    setInterval(spawnFruit, 1000);
    gameLoop();

    // פונקציה לאתחול המשחק מחדש
    function restartGame() {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play();
        score = 0;
        time = 60;
        fruits = [];
        scoreElement.textContent = "Score: " + score;
        countdownElement.textContent = 'Time Left: ' + time;
        restartButton.style.display = 'none';
        timeOut();
    }

    // הוספת מאזין אירועים לכפתור הריסטרט
    restartButton.addEventListener('click', restartGame);
});
