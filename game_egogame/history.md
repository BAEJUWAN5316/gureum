# Project History and Handover Document

This document summarizes the development process for the 2D Ego Game, detailing the steps taken, features implemented, and significant debugging efforts.

## Initial Setup and Core Structure

-   **Project Goal:** Develop a 2D side-scrolling adventure game based on `setting.md`.
-   **File Structure Creation:** Created `/src` and `/assets` directories with subfolders and empty `.js`, `.json` files as per `setting.md`.
-   **Basic HTML (`index.html`):** Set up base HTML5 structure with canvas and `main.js` as a module.
-   **Game Loop (`main.js`):** Implemented `requestAnimationFrame` for game loop, `update(deltaTime)`, `draw()`.

## Core Game Mechanics Implementation

-   **Input System (`input.js`):** Implemented `isKeyDown` to track arrow keys and spacebar.
-   **Player Entity (`player.js`):** Defined `Player` class and implemented movement, jump, and physics integration.
-   **Physics System (`systems/physics.js`):** Implemented gravity and friction.
-   **World & Collision (`world.js`):** Implemented tile-based world, collision detection, and NPC spawn points.
-   **Camera System (`systems/camera.js`):** Implemented a smooth, clamping camera.
-   **Dialogue System (`systems/dialogue.js`):** Implemented `DialogueManager`.
-   **NPC Entity (`entities/npc.js`):** Defined `NPC` class.
-   **HUD (`ui/hud.js`):** Implemented `HUD` class to display ally count.
-   **Door Entity (`entities/door.js`):** Defined `Door` class with opening logic.
-   **Follow System (`systems/follow.js`):** Implemented system for recruited NPCs to follow the player.

## UI/UX Enhancements

-   **Game State Management (`main.js`):** Introduced `GAME_STATE_MENU`, `GAME_STATE_PLAYING`, `GAME_STATE_CLEARED`.
-   **Menu & Clear Screens (`main.js`):** Created basic menu and game clear screens.
-   **Button Interaction (`main.js`):** Added click listeners for buttons.

## Asset Loading & Graphics Integration

-   **AssetLoader (`systems/assetLoader.js`):** Developed a generic `AssetLoader` for images.
-   **Image Integration:** Integrated graphics for player, NPCs, tiles, background, and door.

## Sound Integration

-   **SoundManager (`systems/sound.js`):** Implemented `SoundManager` for sound effects and BGM.
-   **Sound File Format:** Standardized on `.wav` files.

## Debugging Highlights

-   Resolved various `ReferenceError`, `TypeError`, and `SyntaxError` issues during development.
-   Fixed asset 404 errors related to server setup and pathing.
-   Corrected image mapping for NPCs.
-   **Background Music Not Playing:** The initial problem was due to browser autoplay policies. This was the first issue addressed in the next phase.

## Recent Updates (October 2025)

-   **BGM Autoplay Fix:** Resolved the background music issue by implementing `async/await` on the start button's click handler in `main.js`. This ensures the `AudioContext` is fully unlocked by user interaction before `playBGM()` is called, fixing the race condition.
-   **Code Cleanup:** Removed numerous `console.log` statements from `main.js` and `systems/sound.js` that were used for initial debugging.
-   **Sound Control Features:**
    -   **Volume Adjustment:** The master volume in `SoundManager` was set to `0.3` (60% of the previous `0.5`) to lower the BGM volume as requested.
    -   **Continuous BGM:** Removed the `soundManager.stopBGM()` call from the game clear logic in `main.js` to allow music to continue playing on the clear screen.
    -   **Sound ON/OFF Button:**
        -   Added a clickable sound icon to the top-right of the HUD.
        -   Loaded `sound_on.png` and `sound_off.png` assets.
        -   Implemented `toggleMute()` in `SoundManager` and connected it to the HUD icon click in `main.js` to allow the user to mute and unmute all game audio.
-   **Menu Screen Visuals:**
    -   **Title Image:** Replaced the text-based title ("뚱냥를 구해요!") on the main menu with a `title.png` image for a more graphical look.
    -   **Background Image:** Added `start.png` as a full-screen background for both the main menu and the game clear screen.
    -   **Text Visibility:** Changed the color of the instructional and flavor text on the menu and clear screens from white to black to ensure readability against the new background image.

## Current Status

-   All major features from `setting.md` are implemented.
-   All graphics and sound effects are integrated and functioning correctly.
-   Background music now plays reliably and can be toggled by the user.
-   Menu and clear screens have been graphically updated with background and title images.

## Next Steps

-   Implement dynamic UI hints for the door instead of using `console.log`.
-   Further polishing: consider adding player/NPC animations, improving collision physics, or expanding the map.

---
**This document was created by Gemini on [Current Date].**
