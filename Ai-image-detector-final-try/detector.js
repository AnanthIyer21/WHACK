// AI Image Detector Logic
class AIImageDetector {
  constructor() {
    this.model = null;
    this.TILE_SIZE = 32;
    this.TILE_FAKE_THRESHOLD = 0.65;
    this.IMAGE_FAKE_PERCENTAGE = 0.05;
    this.CLASS_NAMES = ['FAKE', 'REAL'];
  }

  async loadModel() {
    if (this.model) return this.model;
    
    try {
      console.log('Loading TensorFlow.js model...');
      const modelUrl = chrome.runtime.getURL('model/model.json');
      console.log('Model URL:', modelUrl);
      
      // Fetch and modify the model JSON to fix weight names
      const response = await fetch(modelUrl);
      const modelJson = await response.json();
      
      console.log('Original weight names:', modelJson.weightsManifest[0].weights.map(w => w.name));
      
      // Strip "sequential/" prefix from weight names to match layer names
      if (modelJson.weightsManifest) {
        modelJson.weightsManifest.forEach(manifest => {
          manifest.weights = manifest.weights.map(weight => {
            const newName = weight.name.replace('sequential/', '');
            console.log(`Mapping weight: ${weight.name} -> ${newName}`);
            return { ...weight, name: newName };
          });
        });
      }
      
      console.log('Modified weight names:', modelJson.weightsManifest[0].weights.map(w => w.name));
      
      // Create a blob URL for the modified JSON
      const modifiedBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
      const modifiedUrl = URL.createObjectURL(modifiedBlob);
      
      // Load with the base path for weights
      this.model = await tf.loadLayersModel(tf.io.browserHTTPRequest(modifiedUrl, {
        requestInit: { mode: 'cors' },
        weightPathPrefix: chrome.runtime.getURL('model/')
      }));
      
      // Clean up blob URL
      URL.revokeObjectURL(modifiedUrl);
      
      console.log('Model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error('Failed to load AI detection model');
    }
  }

  async processImage(imageElement) {
    await this.loadModel();
    
    // Create tiles from the image
    const tiles = await this.createTiles(imageElement);
    
    if (tiles.length === 0) {
      throw new Error('No tiles created from image');
    }

    // Stack tiles into a batch tensor
    const tilesBatch = tf.stack(tiles);
    
    // Run prediction
    const predictions = this.model.predict(tilesBatch);
    const realProbabilities = await predictions.data();
    
    // Calculate fake probabilities
    const fakeProbabilities = Array.from(realProbabilities).map(prob => 1.0 - prob);
    
    // Find max fake probability
    const maxFakeProb = Math.max(...fakeProbabilities);
    
    // Count tiles with strong fake evidence
    const strongFakeTiles = fakeProbabilities.filter(prob => prob >= this.TILE_FAKE_THRESHOLD).length;
    const totalTiles = tiles.length;
    const fakeRatio = strongFakeTiles / totalTiles;
    
    // Make decision
    let prediction;
    if (fakeRatio >= this.IMAGE_FAKE_PERCENTAGE) {
      prediction = this.CLASS_NAMES[0]; // FAKE
    } else {
      prediction = this.CLASS_NAMES[1]; // REAL
    }
    
    // Cleanup tensors
    tilesBatch.dispose();
    predictions.dispose();
    tiles.forEach(tile => tile.dispose());
    
    return {
      prediction,
      maxFakeProb,
      strongFakeTiles,
      totalTiles,
      fakeRatio,
      confidence: prediction === 'FAKE' ? maxFakeProb : (1 - maxFakeProb)
    };
  }

  async createTiles(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const width = imageElement.naturalWidth || imageElement.width;
      const height = imageElement.naturalHeight || imageElement.height;
      
      // Calculate padded dimensions
      const padWidth = Math.ceil(width / this.TILE_SIZE) * this.TILE_SIZE;
      const padHeight = Math.ceil(height / this.TILE_SIZE) * this.TILE_SIZE;
      
      canvas.width = padWidth;
      canvas.height = padHeight;
      
      // Fill with black and draw image
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, padWidth, padHeight);
      ctx.drawImage(imageElement, 0, 0);
      
      const tiles = [];
      
      // Extract tiles
      for (let y = 0; y < padHeight; y += this.TILE_SIZE) {
        for (let x = 0; x < padWidth; x += this.TILE_SIZE) {
          const imageData = ctx.getImageData(x, y, this.TILE_SIZE, this.TILE_SIZE);
          
          // Convert to normalized tensor [32, 32, 3]
          const tile = tf.tidy(() => {
            const tensor = tf.browser.fromPixels(imageData);
            return tf.div(tensor, 255.0);
          });
          
          tiles.push(tile);
        }
      }
      
      console.log(`Extracted ${tiles.length} tiles from ${width}x${height} image`);
      resolve(tiles);
    });
  }
}

// Create global instance
window.aiDetector = new AIImageDetector();