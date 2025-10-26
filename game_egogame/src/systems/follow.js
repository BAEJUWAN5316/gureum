// systems/follow.js

export class FollowSystem {
    constructor() {
        this.playerTrail = [];
        this.trailLength = 60; // Number of positions to store (determines follow distance)
        this.gap = 20; // Gap between followers in the trail
        this.lerpFactor = 0.1; // Smoothness for follower movement
    }

    recordPlayerPosition(player) {
        this.playerTrail.unshift({ x: player.x, y: player.y });
        if (this.playerTrail.length > this.trailLength) {
            this.playerTrail.pop();
        }
    }

    updateFollowers(followers, deltaTime) {
        followers.forEach((follower, idx) => {
            const delay = this.gap * (idx + 1); // Each follower lags by a certain amount
            const targetIndex = Math.min(delay, this.playerTrail.length - 1);
            
            if (targetIndex >= 0) {
                const targetPos = this.playerTrail[targetIndex];
                
                // Smoothly move towards target X
                follower.x += (targetPos.x - follower.x) * this.lerpFactor;
                // Directly set target Y for jump following
                follower.y = targetPos.y;
            }
        });
    }
}

// Simple linear interpolation function (if needed elsewhere, otherwise can be inlined)
// function lerp(start, end, amount) {
//     return start * (1 - amount) + end * amount;
// }