// systems/assetLoader.js

export class AssetLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    loadImages(imagePaths) {
        return new Promise((resolve, reject) => {
            this.totalCount = Object.keys(imagePaths).length;
            if (this.totalCount === 0) {
                resolve();
                return;
            }

            for (const id in imagePaths) {
                const path = imagePaths[id];
                const img = new Image();
                img.onload = () => {
                    this.images[id] = img;
                    this.loadedCount++;
                    if (this.loadedCount === this.totalCount) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${path}`);
                    this.loadedCount++; // Still increment to avoid hanging, but log error
                    if (this.loadedCount === this.totalCount) {
                        resolve();
                    }
                };
                img.src = path;
            }
        });
    }

    getImage(id) {
        return this.images[id];
    }
}
