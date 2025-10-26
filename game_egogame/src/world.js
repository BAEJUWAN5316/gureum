// world.js

export class World {
    constructor(assetLoader) {
        // Force cache refresh: v1.1
        this.tileSize = 32;
        this.assetLoader = assetLoader;
        this.tileImage = this.assetLoader.getImage('tiles');
        this.backgroundImage = this.assetLoader.getImage('background');
        console.log('World tile image:', this.tileImage);
        // Expanded map (50 tiles wide, 15 tiles high for more vertical space)
        this.map = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Ground layer
        ];
        this.mapHeight = this.map.length;
        this.mapWidth = this.map[0].length;

        // Add some platforms
        this.map[this.mapHeight - 4][5] = 1; // Example platform
        this.map[this.mapHeight - 4][6] = 1;
        this.map[this.mapHeight - 4][7] = 1;

        this.map[this.mapHeight - 7][10] = 1;
        this.map[this.mapHeight - 7][11] = 1;
        this.map[this.mapHeight - 7][12] = 1;

        this.map[this.mapHeight - 5][20] = 1;
        this.map[this.mapHeight - 5][21] = 1;
        this.map[this.mapHeight - 5][22] = 1;

        this.map[this.mapHeight - 8][30] = 1;
        this.map[this.mapHeight - 8][31] = 1;
        this.map[this.mapHeight - 8][32] = 1;

        // Updated spawn spots for a wider map and platforms
        this.spawnSpots = [
            { x: 100, y: this.mapHeight * this.tileSize - this.tileSize * 2 }, // Ground
            { x: 300, y: this.mapHeight * this.tileSize - this.tileSize * 2 }, // Ground
            { x: 500, y: this.mapHeight * this.tileSize - this.tileSize * 2 }, // Ground
            { x: 6 * this.tileSize, y: (this.mapHeight - 4) * this.tileSize - this.tileSize }, // Platform 1
            { x: 11 * this.tileSize, y: (this.mapHeight - 7) * this.tileSize - this.tileSize }, // Platform 2
            { x: 21 * this.tileSize, y: (this.mapHeight - 5) * this.tileSize - this.tileSize }, // Platform 3
            { x: 31 * this.tileSize, y: (this.mapHeight - 8) * this.tileSize - this.tileSize }, // Platform 4
            { x: 40 * this.tileSize, y: this.mapHeight * this.tileSize - this.tileSize * 2 }, // Ground further right
        ];
    }

    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (row >= 0 && row < this.mapHeight && col >= 0 && col < this.mapWidth) {
            return this.map[row][col];
        }
        return 0; // Empty tile
    }

    isSolidTile(tileValue) {
        return tileValue === 1; // Only tile 1 is solid for now
    }

    // More comprehensive collision detection
    checkCollision(entity, targetX, targetY) {
        entity.isGrounded = false;

        let resolvedX = targetX;
        let resolvedY = targetY;

        // --- X-axis collision --- 
        let entityRectX = {
            left: targetX,
            right: targetX + entity.width,
            top: entity.y,
            bottom: entity.y + entity.height,
        };

        let startColX = Math.floor(entityRectX.left / this.tileSize);
        let endColX = Math.floor(entityRectX.right / this.tileSize);
        let startRowX = Math.floor(entityRectX.top / this.tileSize);
        let endRowX = Math.floor(entityRectX.bottom / this.tileSize);

        for (let row = startRowX; row <= endRowX; row++) {
            for (let col = startColX; col <= endColX; col++) {
                const tileValue = this.getTileAt(col * this.tileSize, row * this.tileSize);

                if (this.isSolidTile(tileValue)) {
                    const tileRect = {
                        left: col * this.tileSize,
                        right: col * this.tileSize + this.tileSize,
                        top: row * this.tileSize,
                        bottom: row * this.tileSize + this.tileSize,
                    };

                    // Check for overlap
                    if (entityRectX.right > tileRect.left && entityRectX.left < tileRect.right &&
                        entityRectX.bottom > tileRect.top && entityRectX.top < tileRect.bottom) {
                        
                        // Collision on X-axis
                        if (entity.vx > 0) { // Moving right, hit left side of tile
                            resolvedX = tileRect.left - entity.width;
                            entity.vx = 0;
                        } else if (entity.vx < 0) { // Moving left, hit right side of tile
                            resolvedX = tileRect.right;
                            entity.vx = 0;
                        }
                        // Update entityRectX after resolution
                        entityRectX.left = resolvedX;
                        entityRectX.right = resolvedX + entity.width;
                    }
                }
            }
        }

        // --- Y-axis collision --- 
        let entityRectY = {
            left: resolvedX, // Use resolved X for Y collision check
            right: resolvedX + entity.width,
            top: targetY,
            bottom: targetY + entity.height,
        };

        let startColY = Math.floor(entityRectY.left / this.tileSize);
        let endColY = Math.floor(entityRectY.right / this.tileSize);
        let startRowY = Math.floor(entityRectY.top / this.tileSize);
        let endRowY = Math.floor(entityRectY.bottom / this.tileSize);

        for (let row = startRowY; row <= endRowY; row++) {
            for (let col = startColY; col <= endColY; col++) {
                const tileValue = this.getTileAt(col * this.tileSize, row * this.tileSize);

                if (this.isSolidTile(tileValue)) {
                    const tileRect = {
                        left: col * this.tileSize,
                        right: col * this.tileSize + this.tileSize,
                        top: row * this.tileSize,
                        bottom: row * this.tileSize + this.tileSize,
                    };

                    // Check for overlap
                    if (entityRectY.right > tileRect.left && entityRectY.left < tileRect.right &&
                        entityRectY.bottom > tileRect.top && entityRectY.top < tileRect.bottom) {

                        // Collision on Y-axis
                        if (entity.vy > 0) { // Falling, hit top side of tile
                            resolvedY = tileRect.top - entity.height;
                            entity.vy = 0;
                            entity.isGrounded = true;
                        } else if (entity.vy < 0) { // Jumping, hit bottom side of tile
                            resolvedY = tileRect.bottom;
                            entity.vy = 0;
                        }
                    }
                }
            }
        }

        // Apply resolved positions
        entity.x = resolvedX;
        entity.y = resolvedY;

        // Keep entity within world bounds horizontally
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        }
        if (entity.x + entity.width > this.mapWidth * this.tileSize) {
            entity.x = this.mapWidth * this.tileSize - entity.width;
            entity.vx = 0;
        }

        // Fall off the world (simple death/respawn condition)
        if (entity.y > this.mapHeight * this.tileSize) {
            console.log("Player fell off the world!");
            entity.x = 50; // Respawn at start
            entity.y = 0;
            entity.vy = 0;
        }
    }

    draw(ctx, cameraX, cameraY) {
        // Draw background image
        if (this.backgroundImage) {
            // Draw the background to cover the entire game world, scrolling with the camera
            // We might need to tile it or scale it depending on the image size and world size
            // For simplicity, let's assume it's wide enough and just draw it once.
            ctx.drawImage(this.backgroundImage, -cameraX, 0, this.mapWidth * this.tileSize, ctx.canvas.height);
        }

        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                const tile = this.map[row][col];
                if (tile === 1) { // Assuming 1 is a solid ground/platform tile
                    if (this.tileImage) {
                        ctx.drawImage(this.tileImage, col * this.tileSize - cameraX, row * this.tileSize - cameraY, this.tileSize, this.tileSize);
                    } else {
                        ctx.fillStyle = 'green';
                        ctx.fillRect(
                            col * this.tileSize - cameraX,
                            row * this.tileSize - cameraY,
                            this.tileSize,
                            this.tileSize
                        );
                    }
                }
            }
        }
    }
}

export function getRandomSpawnPoints(world, count) {
    // Force cache refresh: v1.2
    const shuffled = [...world.spawnSpots].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}