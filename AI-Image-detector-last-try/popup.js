const TILE_SIZE = 32;
const TILE_FAKE_THRESHOLD = 0.65;
const IMAGE_FAKE_PERCENTAGE = 0.05;

let model;

async function loadModel() {
    // Note: The URL is relative to the extension root
    const modelUrl = chrome.runtime.getURL('model.json');
    try {
        // tf.loadLayersModel is used for Keras models converted with save_keras_model
        model = await tf.loadLayersModel(modelUrl);
        document.getElementById('output').innerText = 'Model Loaded. Ready to analyze.';
        document.getElementById('analyzeBtn').disabled = false;
    } catch (e) {
        document.getElementById('output').innerText = `Error loading model: ${e.message}`;
        console.error("Model loading error:", e);
    }
}

async function loadModel() {
    // 1. Give initial feedback
    document.getElementById('output').innerText = 'Downloading model files...';

    // Set backend for stability (optional, but good for first run)
    await tf.setBackend('webgl'); 
    
    try {
        const modelUrl = chrome.runtime.getURL('model.json');
        
        // 2. Start model load
        model = await tf.loadLayersModel(modelUrl);
        
        // 3. Confirm loading is complete
        document.getElementById('output').innerText = 'Model Loaded. Ready to analyze.';
        document.getElementById('analyzeBtn').disabled = false;
    } catch (e) {
        document.getElementById('output').innerText = `Error loading model: ${e.message}`;
        console.error("Model loading error:", e);
    }
}

// Equivalent to your create_tiles and classification logic
async function classifyImage(imgElement) {
    document.getElementById('output').innerText = 'Analyzing...';
    
    // 1. Image Preprocessing (similar to your create_tiles)
    const imageTensor = tf.browser.fromPixels(imgElement).toFloat().div(tf.scalar(255.0));
    const [height, width, channels] = imageTensor.shape;

    // Calculate padding sizes (similar to math.ceil(width / TILE_SIZE) * TILE_SIZE)
    const padWidth = Math.ceil(width / TILE_SIZE) * TILE_SIZE;
    const padHeight = Math.ceil(height / TILE_SIZE) * TILE_SIZE;

    // Pad the image tensor with zeros
    const padX = padWidth - width;
    const padY = padHeight - height;
    const paddedTensor = imageTensor.pad([
        [0, padY],
        [0, padX],
        [0, 0] // No channel padding
    ]);

    const tiles = [];
    for (let y = 0; y < padHeight; y += TILE_SIZE) {
        for (let x = 0; x < padWidth; x += TILE_SIZE) {
            // Slice out the 32x32 tile
            const tile = paddedTensor.slice([y, x, 0], [TILE_SIZE, TILE_SIZE, channels]);
            tiles.push(tile);
        }
    }

    if (tiles.length === 0) {
        document.getElementById('output').innerText = 'Analysis failed: No tiles generated.';
        return;
    }

    // Stack tiles for batched prediction
    const tilesBatch = tf.stack(tiles); 
    const totalTiles = tiles.length;

    // 2. Prediction
    const predictions = model.predict(tilesBatch);
    
    // 3. Process Predictions (Decision Logic)
    // Assuming model outputs [FAKE_prob, REAL_prob] for each tile (like Keras default)
    // If your model outputs a single value (REAL_prob), you'll need to adjust.
    // The Python code suggests it's a binary classification returning REAL_prob, so 1.0 - REAL_prob is FAKE_prob.
    
    const realProbabilities = predictions.arraySync().map(p => p[1] || p[0]); // Assuming single output is REAL prob or it is the second of two outputs

    const fakeProbabilities = realProbabilities.map(p => 1.0 - p);

    let strongFakeTiles = 0;
    let maxFakeProb = 0;
    
    for (const fakeProb of fakeProbabilities) {
        if (fakeProb > maxFakeProb) {
            maxFakeProb = fakeProb;
        }
        if (fakeProb >= TILE_FAKE_THRESHOLD) {
            strongFakeTiles++;
        }
    }

    const fakeRatio = strongFakeTiles / totalTiles;
    
    let overallPrediction;
    if (fakeRatio >= IMAGE_FAKE_PERCENTAGE) {
        overallPrediction = 'FAKE (AI-GENERATED)';
    } else {
        overallPrediction = 'REAL';
    }

    // 4. Display Results
    document.getElementById('output').innerHTML = 
        `**Overall Classification:** **${overallPrediction}**<br>` +
        `Tiles above ${TILE_FAKE_THRESHOLD * 100}% FAKE Confidence: ${strongFakeTiles} / ${totalTiles} (${(fakeRatio * 100).toFixed(2)}%)<br>` +
        `Max 'FAKE' Probability: ${maxFakeProb.toFixed(4)}`;

    // Clean up tensors to free up memory
    tf.dispose([imageTensor, paddedTensor, tilesBatch, predictions]);
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', loadModel);

document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Ensure model is loaded before analysis
                if (model) {
                    classifyImage(img);
                } else {
                    document.getElementById('output').innerText = 'Model still loading... please wait.';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});
