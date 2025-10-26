// systems/physics.js

const GRAVITY = 9.8 * 50; // pixels/second^2
const GROUND_FRICTION = 0.8; // Multiplier for horizontal velocity on ground

export function applyGravity(entity, deltaTime) {
    entity.vy += GRAVITY * deltaTime;
}

export function applyFriction(entity) {
    if (entity.isGrounded) {
        entity.vx *= GROUND_FRICTION;
    }
}

export function updatePosition(entity, deltaTime) {
    entity.x += entity.vx * deltaTime;
    entity.y += entity.vy * deltaTime;
}
