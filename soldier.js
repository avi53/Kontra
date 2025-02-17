class Soldier {
    constructor(game, x, y, path) {
        Object.assign(this, {game, x, y, path});

        this.intialPoint = { x, y };

        this.radius = 20;
        this.visualRadius = 200;
        this.dead = false;
        this.width = 30 * PARAMS.SCALE;
        this.height = 34 * PARAMS.SCALE;

        this.isOnGround = false;
        this.ledge = 0;

        this.WALK_SPEED = 190;
        this.FALL_SPEED = 200;
        this.DEAD_SPEED = 0.22;

        this.initialX = this.x;

        this.spritesheet = ASSET_MANAGER.getAsset("./sprites/Soldier.png");

        this.targetID = 0;
        if (this.path && this.path[this.targetID]) this.target = this.path[this.targetID];

        let dist = distance(this, this.target);
        this.maxSpeed = 50; //px per sec
        this.velocity = {x: (this.target.x - this.x) / dist * this.maxSpeed, y: (this.target.y - this.y) / dist * this.maxSpeed};

        this.updateBoundingBox();
        this.lastBB = this.BB;

        this.animations = [];
        this.animations.push([]);
        // running
        this.animations[0].push(new Animator(this.spritesheet, 38, 39, 19, 34, 5, 0.1, 37, false, true));
        //dying
        this.animations[0].push(new Animator(this.spritesheet, 307, 37, 33, 35, 4, 0.1, 33.5, false, false));

        this.state = 0; //0 = running, 1 = dead sprite
        this.facing = 1; // 0 = right, 1 = left

        this.elapsedTime = 0;
    }

    updateBoundingBox() {
        this.BB = new BoundingBox(this.x, this.y, this.width - this.width/2 + 16, this.height);
    };

    updateLastBoundingBox() {
        this.lastBB = this.BB;
    };

    die() {
        this.state = 1;
        this.dead = true;
        ASSET_MANAGER.playAsset("sounds/enemy_hit.mp3");
    };

    removeFromCanvas() {
        this.removeFromWorld = true;
    }

    update() {
        // Don't update if far beyond camera
        if (this.x > this.game.camera.x + PARAMS.CANVAS_WIDTH + this.FALL_SPEED*PARAMS.SCALE) return;
        this.elapsedTime += this.game.clockTick;

        if (this.state === 1) { // Dead
            let deltaX = this.x - this.initialX;
            this.y -= Math.sqrt(Math.abs(deltaX)) / 20;
            if (this.y < 320) this.x += this.DEAD_SPEED * this.elapsedTime;
            this.BB = new BoundingBox(-PARAMS.CANVAS_WIDTH, -PARAMS.CANVAS_HEIGHT, 0, 0); // Invalidate bounding box
            // this.x += this.DEAD_SPEED * this.elapsedTime;
            setTimeout(this.removeFromCanvas.bind(this), 550);
            return;
        }

        let dist = distance(this, this.target);
        if (dist < 5) {
            if (this.targetID < this.path.length - 1 && this.target === this.path[this.targetID]) {
                this.targetID++;
            }
            this.target = this.path[this.targetID];
        }

        // movement
        if (this.velocity.x < this.WALK_SPEED) {
            this.velocity.x += this.WALK_SPEED * this.elapsedTime;
        }

        this.x -= this.velocity.x * this.game.clockTick;
        if (!this.isOnGround) { // fall if not on ground
            this.y += this.FALL_SPEED  * this.game.clockTick; // TODO: Convert to elapsed time?
        }
        

        //collision detection for when enemy reaches lance
        this.updateBoundingBox();
        this.game.entities.forEach(ent => {
            if (ent instanceof Lance && canSee(this, ent)) {
                this.target = ent;
            }
            // Physical Collisons
            if (ent.BB && this.BB.collide(ent.BB)) {
                if (ent instanceof Ground && this.lastBB.bottom <= ent.BB.top) { // Ground
                    this.y = ent.BB.y - this.BB.height;
                    this.isOnGround = true;
                    this.ledge = ent.BB.left;
                    this.updateBoundingBox();
                }
            }
        });
        this.updateLastBoundingBox();

        // Walked off ledge
        if (this.x < this.ledge - this.BB.width) this.isOnGround = false;

        // Die if falls off screen
        if (this.y > PARAMS.CANVAS_HEIGHT) this.die();
    }
    
    draw(ctx) {
        if (this.state === 0) {
            this.animations[0][0].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y, PARAMS.SCALE);
        } else {
            this.animations[0][1].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y, PARAMS.SCALE);
        }

        if (PARAMS.DEBUG) {
            ctx.strokeRect(this.BB.x - this.game.camera.x, this.BB.y, this.BB.width, this.BB.height);
            ctx.font = "10px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("x: " + this.x, this.x - this.game.camera.x, this.y - 10);
            ctx.fillText("y: " + this.y, this.x - this.game.camera.x, this.y - 20);
            ctx.fillText("state: " + this.state, this.x - this.game.camera.x, this.y - 30);
            ctx.fillText("facing: " + this.facing, this.x - this.game.camera.x, this.y - 40);
        }
    }
}