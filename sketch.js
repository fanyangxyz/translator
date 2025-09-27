let particles = [];
let colors = ['#ff8c00', '#ff6b47', '#ffa500', '#ff7f50', '#ff4500', '#d2691e'];

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-canvas');

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    clear();

    for (let particle of particles) {
        particle.update();
        particle.display();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Particle {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, 0.5);
        this.size = random(20, 60);
        this.color = random(colors);
        this.alpha = random(0.1, 0.3);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, 0, height);
    }

    display() {
        push();
        translate(this.x, this.y);
        fill(red(this.color), green(this.color), blue(this.color), this.alpha * 255);
        noStroke();
        ellipse(0, 0, this.size);
        pop();
    }
}