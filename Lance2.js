class Lance2 {
    constructor(game, x, y) {
        Object.assign(this, {game, x, y});

        this.game.player2Controls.lance2 = this;

        this.radius = 20;
        this.visualRadius = 200;

        this.spritesheet2 = ASSET_MANAGER.getAsset("./sprites/Lance_3.png");


        //Lance2's state variables
        this.facing = 0; // 0 = right, 1 = left
        /*
         * 0 = idle, 1 = walking, = 2 = jumping, 3 = falling, 4 = walk diagonal up left, 
         * 5 = walk diagonal down left, 6 = walk diagonal up right, 
         * 7 = walk diagonal down right, 8 = crouching, 9 = looking up, 10 = dead,
         * 11 = walk/shooting
        */
        this.state = 2; // Start in jumping state
        this.dead = false;
        this.isSpawning = true;
        this.isOnGround = false;
        this.isJumping = false;
        this.isDropping = false; // Dropping from platform
        this.lives = 4;
        this.collided = false;
        this.hit = false;
        this.deathAnimatedOnce = 0;

        this.velocity = {x: 0, y: 0};
        this.WALK_SPEED = 300;
        this.FALL_SPEED = 200;
        this.JUMP_TICK = 0;
        this.width = 30 * PARAMS.SCALE;
        this.height = 34 * PARAMS.SCALE;

        // The edges of the last touched ground entity
        this.ledgeR = 0; 
        this.ledgeL = 0;
        this.lastGroundTop = 0;

        this.updateBoundingBox();
        this.lastBB = this.BB;

        //Lance2's Animations
        this.animations = [];
        this.loadAnimations();

        this.elapsedTime = 0;
        this.fireRate = 0.120; // how many seconds between bullets.
        this.bulletCount = 0; // How many bullets have been fired (and still exist)
        this.maxBullets = 5; // how many bullets allowed at once
        this.lastBulletTime = 0;
    };

    loadAnimations() {

        //all animations here

        for (let i = 0; i < 12; i++) {   // 12 states
            this.animations.push([]);
            for (let j = 0; j < 2; j++) {   // 2 directions
                this.animations[i].push([]);
            }
        }

        // idle right
        this.animations[0][0] = new Animator(this.spritesheet2, 105, 610, 30, 34, 1, 0.1, 30, false, true);
        // idle left
        this.animations[0][1] = new Animator(this.spritesheet2, 105, 495, 30, 34, 1, 0.1, 30, false, true);

        // walk right
        this.animations[1][0] = new Animator(this.spritesheet2, 175, 610, 30, 34, 6, 0.1, 30, false, true);
        // walk left
        this.animations[1][1] = new Animator(this.spritesheet2, 175, 495, 30, 34, 6, 0.1, 30, false, true);

        // jump right
        this.animations[2][0] = new Animator(this.spritesheet2, 38, 825, 20, 22, 2, 0.1, 36, false, true);
        // jump left
        this.animations[2][1] = new Animator(this.spritesheet2, 38, 725, 20, 22, 2, 0.1, 36, true, true); //reverse bc sprites reversed on sheet

        // walk diagonal left/up
        this.animations[4][1] = new Animator(this.spritesheet2, 272, 38, 22, 36, 3, 0.1, 36.4, true, true); //reverse bc sprites reversed on sheet
        // walk diagonal left/down
        this.animations[5][1] = new Animator(this.spritesheet2, 90, 38, 25, 36, 3, 0.1, 36.4, true, true); //reverse bc sprites reversed on sheet
        // walk diagonal right/up
        this.animations[6][0] = new Animator(this.spritesheet2, 38, 164, 22, 36, 3, 0.1, 36.4, false, true);
        // walk diagonal right/down
        this.animations[7][0] = new Animator(this.spritesheet2, 212, 164, 25, 36, 3, 0.1, 36.4, false, true);

        // crouch left
        this.animations[8][1] = new Animator(this.spritesheet2, 38, 495, 34, 18, 1, 0.1, 30, false, true);
        // crouch right
        this.animations[8][0] = new Animator(this.spritesheet2, 38, 610, 34, 18, 1, 0.1, 30, false, true);

        // look up left
        this.animations[9][1] = new Animator(this.spritesheet2, 38, 38, 18, 45, 1, 0.1, 30, false, true);
        // look up right
        this.animations[9][0] = new Animator(this.spritesheet2, 395, 164, 18, 45, 1, 0.1, 30, false, true);

        // dead left
        this.animations[10][1] = new Animator(this.spritesheet2, 38, 288, 34, 24, 3, 0.2, 25, true, true); //reverse bc sprites reversed on sheet
        // dead right
        this.animations[10][0] = new Animator(this.spritesheet2, 38, 392, 34, 24, 3, 0.2, 25, false, true);

        // walk left and shooting
        this.animations[11][1] = new Animator(this.spritesheet2, 38, 925, 28, 35, 3, 0.1, 36, true, true);
        // walk right and shooting
        this.animations[11][0] = new Animator(this.spritesheet2, 38, 1039, 28, 35, 3, 0.1, 36, false, true);
    };

    updateBoundingBox() {
        switch (this.state) { // One of the switch statements of all time
            case 1: // Moving
                this.BB = new BoundingBox(this.x + 5, this.y, this.width - this.width/2 + 4, this.height);
                break;
            case 6: // Up-right
            case 4: // Up-left
                this.BB = new BoundingBox(this.x + 15, this.y, this.width - this.width/2 + 4, this.height);
                break;
            case 7: // down-right
            case 5: // down-left
                this.BB = new BoundingBox(this.x + 15, this.y, this.width - this.width/2 + 4, this.height);
                break;
            case 9: // UP
                this.BB = new BoundingBox(this.x + 10, this.y, this.width - this.width/2 - 5, this.height);
                break;
            default:
                if (this.facing === 0) { // Right
                    if (this.state == 0) // idle right
                        this.BB = new BoundingBox(this.x + 30, this.y, this.width - this.width/2 - 5, this.height);
                    if (this.state === 11) // Moving and shooting right
                        this.BB = new BoundingBox(this.x + 15, this.y, this.width - this.width/2, this.height);
                } else if (this.facing === 1) {  // Left
                    if  (this.state == 0) // idle left
                        this.BB = new BoundingBox(this.x + 15, this.y, this.width - this.width/2, this.height);
                    if (this.state === 11) // Moving and shooting left
                        this.BB = new BoundingBox(this.x + 36, this.y, this.width - this.width/2, this.height);
                } else {
                    this.BB = new BoundingBox(this.x + 30, this.y, this.width - this.width/2 - 5, this.height);
                }
        }

        if (!this.isDropping && (!this.isOnGround || this.isJumping)) {
            this.BB = new BoundingBox(this.x, this.y, this.width-42, this.height - 12*PARAMS.SCALE);
        } else if (this.state === 8 && this.isOnGround) { // crouching on ground
            this.BB = new BoundingBox(this.x, this.y, this.width + 4*PARAMS.SCALE, this.height - 16*PARAMS.SCALE);
        } else if (this.state === 8) {
            this.BB = new BoundingBox(this.x, this.y, this.width + 4*PARAMS.SCALE, this.height - 16*PARAMS.SCALE);
        }
    };

    updateLastBoundingBox() {
        this.lastBB = this.BB;
    };

    die() {
        if (this.isSpawning || this.dead) return; // Don't die if spawning
        ASSET_MANAGER.playAsset("sounds/lance_death.mp3");
        this.dead = true;
        this.y += 250;
        this.state = 10;
        this.lives--;
        console.log("Lance2 died, lives left: " + this.lives);
        setTimeout(this.respawn.bind(this), 1700);
    };

    respawn() {
        this.state = 2; // Start in jumping state
        this.y = 0; // TODO: Perhaps spawn at default lance2 x/y?
        this.isSpawning = true;
        this.isOnGround = false;
        this.isJumping = false;
        this.isDropping = false;
        this.collided = false;
        this.hit = false;
        this.deathAnimatedOnce = 0;
        this.dead = false;
    }

    update() {
        const TICK = this.game.clockTick;
        this.elapsedTime += TICK;

        if (this.dead) return;
        // A button
        if (this.game.player2Controls.A && this.isOnGround) {
            if (!this.game.player2Controls.right && !this.game.player2Controls.left && this.game.player2Controls.down) { // Drop from platform
                this.isOnGround = false;
                this.isDropping = true;
            } else if (!this.isJumping) { // Jump
                this.isJumping = true;
                this.isOnGround = false;
                this.JUMP_TICK = 1;
            }
        }

        // Jump action
        if (this.isJumping) {
            if (this.JUMP_TICK > 0) {
                this.JUMP_TICK -= TICK;
                this.y -= this.FALL_SPEED * TICK
            } else if (!this.isDropping) {
                this.isJumping = false;
            }
        }
      
        // update state
        if (this.game.player2Controls.right && this.game.player2Controls.up) this.state = 6;
        else if (this.game.player2Controls.right && this.game.player2Controls.down) this.state = 7;
        else if (this.game.player2Controls.left && this.game.player2Controls.up) this.state = 4;
        else if (this.game.player2Controls.left && this.game.player2Controls.down) this.state = 5;
        else if (this.game.player2Controls.left && this.game.player2Controls.B) this.state = 11;
        else if (this.game.player2Controls.right && this.game.player2Controls.B) this.state = 11;
        else if (this.game.player2Controls.left) this.state = 1;
        else if (this.game.player2Controls.right) this.state = 1;
        else if (this.game.player2Controls.down && !this.isDropping) this.state = 8;
        else if (this.game.player2Controls.up) this.state = 9
        else if (this.dead) this.state = 10;
        else this.state = 0; // idle state;

        // Movement
        if (this.game.player2Controls.right) {
            this.x += this.WALK_SPEED * TICK
            this.facing = 0; // right
        } else if (this.game.player2Controls.left) {
            this.x -= this.WALK_SPEED * TICK
            this.facing = 1; // left
        } 

        // Bullet logic
        if (this.game.player2Controls.B) {
            if (this.elapsedTime - this.lastBulletTime > this.fireRate && this.bulletCount < this.maxBullets) {
                switch (this.state) {
                    case 0:
                    case 0: // Standing
                        if (this.facing === 0) { // right
                            this.game.addEntity(new Bullet(this.game, this.x + this.width, this.y + this.width/2 - PARAMS.SCALE, this, false, 0, true));
                        } else { // left
                            this.game.addEntity(new Bullet(this.game, this.x - 6 * PARAMS.SCALE, this.y + this.width/2 - PARAMS.SCALE, this, false, 180, true));
                        }
                        break;
                    case 11: //running fire
                        if (this.facing === 0) { // right
                            this.game.addEntity(new Bullet(this.game, this.x + this.width, this.y + this.width/2 - 3*PARAMS.SCALE, this, false, 0, true));
                        } else { // left
                            this.game.addEntity(new Bullet(this.game, this.x - 6 * PARAMS.SCALE, this.y + this.width/2 - 3*PARAMS.SCALE, this, false, 180, true));
                        }
                        break;
                    case 6: // up right
                        this.game.addEntity(new Bullet(this.game, this.BB.right, this.y + 2*PARAMS.SCALE, this, false, 45, true));
                        break;
                    case 7: // down right
                        this.game.addEntity(new Bullet(this.game, this.BB.right+5*PARAMS.SCALE, this.y + 22*PARAMS.SCALE, this, false, 315, true));                        break;
                    case 4: // up left
                        this.game.addEntity(new Bullet(this.game, this.BB.left, this.y + 4*PARAMS.SCALE, this, false, 135, true));
                        break;
                    case 5: // down left
                        this.game.addEntity(new Bullet(this.game, this.BB.left-5*PARAMS.SCALE, this.y + 22* PARAMS.SCALE, this, false, 225, true));
                        break;
                    case 8: // crouching
                        if (!this.isOnGround) { // Mid jump
                            this.game.addEntity(new Bullet(this.game, this.x + this.width/2 - 20, this.y + 27*PARAMS.SCALE - PARAMS.SCALE, this, false, 270, true));
                        } else if (this.facing === 0) { // right
                            this.game.addEntity(new Bullet(this.game, this.BB.right, this.y + this.BB.height/2 + 2, this, false, 0, true));                        }
                        else {
                            this.game.addEntity(new Bullet(this.game, this.BB.left, this.y + this.BB.height/2 + 2, this, false, 180, true));                        }
                        break;
                    case 9: // up
                        if (this.facing === 1) {
                            this.game.addEntity(new Bullet(this.game, this.x + 4 * PARAMS.SCALE, this.y - 8 * PARAMS.SCALE, this, false, 90, true, false));
                        } else {
                            this.game.addEntity(new Bullet(this.game, this.x + this.width/2 - 4 * PARAMS.SCALE, this.y - 8 * PARAMS.SCALE, this, false, 90, true, false));
                        }
                        break;
                    default:
                        console.log("Lance2 firing hit default state with state == "+ this.state +", this shouldn't happen")
                }
    
                this.bulletCount++; // We give bullet `this` as source, so it can reduce bullet count when it removes itself                
                ASSET_MANAGER.playAsset("sounds/gun_sound.mp3");
                this.lastBulletTime = this.elapsedTime;
            }
        }

        if (this.isOnGround && (this.x >= this.ledgeR + 10 || this.x <= this.ledgeL - 10)) { // walked off ledge
            this.isDropping = true;
            this.isOnGround = false;
        }

        // Fall unless on ground or jumping
        if (!this.isJumping || this.isJumping && this.isDropping) {
            this.y += this.FALL_SPEED * TICK;
        }

        // Crouch on ground
        if (!this.isDropping && this.isOnGround && this.game.player2Controls.down) {
            this.y += 64;
        }

        // Check Collisions
        this.updateBoundingBox();
        this.game.entities.forEach(entity => {
            if (entity.BB && this.BB.collide(entity.BB)) { // Enitity has BB and collides
                if (this.isDropping && entity instanceof Ground && this.lastBB.bottom <= this.lastGroundTop) { // Ignore previous ground collision when dropping
                } else if (!this.isJumping && entity instanceof Ground && this.lastBB.bottom <= entity.BB.top) { // Collided with ground
                    this.land(entity);
                // } else if (this.isOnGround && entity instanceof Ground && this.lastBB.right >= entity.BB.left && this.lastBB.left < entity.BB.left) { // Left of wall
                //     this.x = entity.BB.left - this.BB.width;
                //     this.velocity.x = 0;
                //     this.updateBoundingBox(); // Needed?
                // } else if (this.isOnGround && entity instanceof Ground && this.lastBB.left >= entity.BB.right - 20) { // Right of wall
                //     this.x = entity.BB.right;
                //     this.velocity.x = 0;
                //     this.updateBoundingBox(); // Needed?
                } else if (entity instanceof Soldier && this.BB.collide(entity.BB) && !this.collided) {
                    this.die();
                }
            }
        });

        this.updateLastBoundingBox();

        if (this.y >= PARAMS.CANVAS_HEIGHT) { // hit bottom of screen
            this.isSpawning = false;
            this.die();
        }
    };

    land(entity) {
        this.isOnGround = true;
        this.isJumping = false;
        this.isSpawning = false;
        this.isDropping = false;
        this.updateBoundingBox(); // Update bounding box now that we've landed and changed BB state
        this.y = entity.BB.y - this.BB.height;
        this.updateBoundingBox(); // Update bounding box now that we've moved lance2 up to the top of the ground
        // Magic numbers to align more with feet
        this.ledgeR = entity.BB.right - 10;
        this.ledgeL = entity.BB.left - this.width + 50;
        this.lastGroundTop = entity.BB.top;
    }


    draw(ctx) {
        if (!this.dead && (this.isJumping || this.isSpawning || (!this.isOnGround && !this.isDropping))) { // Jumping takes precidence
            this.animations[2][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y, PARAMS.SCALE);
        } else if (this.state == 0) { // if idle
            if (this.facing == 1) { // if facing left
                ctx.drawImage(this.spritesheet2, 105, 495, 30, 34, this.x - this.game.camera.x - this.width/2 + 16, this.y, 1.85 *PARAMS.BLOCKWIDTH, 2 * PARAMS.BLOCKWIDTH + 8);
            } else { // facing right
                ctx.drawImage(this.spritesheet2, 105, 610, 30, 34, this.x - this.game.camera.x, this.y, 1.85 * PARAMS.BLOCKWIDTH, 2 * PARAMS.BLOCKWIDTH + 8);
            }
        } else if (this.state === 8) { // crouching  
            this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y, PARAMS.SCALE);
        } else if (this.state === 9) { //looking directly up
            this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y - 11 *PARAMS.SCALE, PARAMS.SCALE);
        } else if (this.state === 10) {
            if (this.deathAnimatedOnce == 75) {
                if (this.facing == 0) ctx.drawImage(this.spritesheet2, 156, 392, 33, 24, this.x - this.game.camera.x, this.y - 40 * PARAMS.SCALE, 33 * PARAMS.SCALE, 24 * PARAMS.SCALE);
                else ctx.drawImage(this.spritesheet2, 39, 289, 33, 24, this.x - this.game.camera.x, this.y - 40 * PARAMS.SCALE, 33 * PARAMS.SCALE, 24 * PARAMS.SCALE);
            } else {
                this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y - 40 *PARAMS.SCALE, PARAMS.SCALE);
                this.deathAnimatedOnce++;
            }
        } else {
            this.animations[this.state][this.facing].drawFrame(this.game.clockTick, ctx, this.x - this.game.camera.x, this.y - 2 * PARAMS.SCALE, PARAMS.SCALE);
        }

        if (PARAMS.DEBUG) {
            ctx.strokeStyle = 'Red';
            ctx.strokeRect(this.BB.x - this.game.camera.x, this.BB.y, this.BB.width, this.BB.height);
            ctx.font = "10px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("x: " + this.x, this.x - this.game.camera.x, this.y - 10);
            ctx.fillText("y: " + this.y, this.x - this.game.camera.x, this.y - 20);
            ctx.fillText("state: " + this.state, this.x - this.game.camera.x, this.y - 30);
            ctx.fillText("facing: " + this.facing, this.x - this.game.camera.x, this.y - 40);
            ctx.fillText("isOnGround: " + this.isOnGround, this.x - this.game.camera.x, this.y - 50);
            ctx.fillText("isJumping: " + this.isJumping, this.x - this.game.camera.x, this.y - 60);
            ctx.fillText("isDropping: " + this.isDropping, this.x - this.game.camera.x, this.y - 70);
            ctx.fillText("lastGroundTop: " + this.lastGroundTop, this.x - this.game.camera.x, this.y - 80);
        }
    };
}