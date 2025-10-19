export class InputHandler {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            action: false
        };

        // Action Button (설득 버튼)
        const actionBtn = document.getElementById('action-button');
        this.addTouchListener(actionBtn, 'action');

        // Virtual Joystick (nipple.js)
        this.initJoystick();

        // Keyboard events (for testing)
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'w': case 'ArrowUp': this.keys.up = true; break;
                case 's': case 'ArrowDown': this.keys.down = true; break;
                case 'a': case 'ArrowLeft': this.keys.left = true; break;
                case 'd': case 'ArrowRight': this.keys.right = true; break;
                case 'e': this.keys.action = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'w': case 'ArrowUp': this.keys.up = false; break;
                case 's': case 'ArrowDown': this.keys.down = false; break;
                case 'a': case 'ArrowLeft': this.keys.left = false; break;
                case 'd': case 'ArrowRight': this.keys.right = false; break;
                case 'e': this.keys.action = false; break;
            }
        });
    }

    addTouchListener(element, key) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys[key] = true;
        });

        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys[key] = false;
        });
        
        // Mouse events (for PC testing convenience)
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.keys[key] = true;
        });

        element.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.keys[key] = false;
        });
    }

    initJoystick() {
        const joystickZone = document.getElementById('joystick-zone');
        const options = {
            zone: joystickZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white',
            size: 100
        };

        const manager = nipplejs.create(options);

        manager.on('move', (evt, data) => {
            if (data.angle) {
                const angle = data.angle.degree;
                // Reset directions
                this.keys.up = false;
                this.keys.down = false;
                this.keys.left = false;
                this.keys.right = false;

                // Determine direction based on angle
                if (angle > 45 && angle < 135) {
                    this.keys.up = true;
                } else if (angle > 225 && angle < 315) {
                    this.keys.down = true;
                } else if (angle >= 135 && angle <= 225) {
                    this.keys.left = true;
                } else { // angle < 45 or angle > 315
                    this.keys.right = true;
                }
            }
        });

        manager.on('end', () => {
            // Reset all directions when joystick is released
            this.keys.up = false;
            this.keys.down = false;
            this.keys.left = false;
            this.keys.right = false;
        });
    }
}