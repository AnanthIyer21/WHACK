// Popup UI Logic
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const preview = document.getElementById('preview');
  const previewImg = document.getElementById('previewImg');
  const clearBtn = document.getElementById('clearBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const analyzeAnother = document.getElementById('analyzeAnother');

  let currentImage = null;

  // NEW: Check for pending image from context menu
  chrome.storage.local.get(['pendingImageUrl', 'timestamp'], (result) => {
    if (result.pendingImageUrl) {
      // Only process if clicked within last 5 seconds
      if (Date.now() - result.timestamp < 5000) {
        loadImageFromUrl(result.pendingImageUrl);
      }
      // Clear the pending data
      chrome.storage.local.remove(['pendingImageUrl', 'timestamp']);
    }
  });

  // NEW: Function to load image from URL
  function loadImageFromUrl(url) {
    // Show loading state
    dropZone.classList.add('hidden');
    loading.classList.remove('hidden');
    
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          currentImage = e.target.result;
          
          loading.classList.add('hidden');
          preview.classList.remove('hidden');
          
          // Wait for image to load then analyze
          previewImg.onload = () => {
            analyzeImage();
          };
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Error loading image from URL:', err);
        alert('Failed to load image from webpage. The image may be protected or from a different domain.');
        resetUI();
      });
  }

  // Browse button click
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Drop zone click
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  });

  // Drag and drop handlers
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    resetUI();
  });

  // Analyze another button
  analyzeAnother.addEventListener('click', () => {
    resetUI();
  });

  function handleImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      currentImage = e.target.result;
      
      dropZone.classList.add('hidden');
      preview.classList.remove('hidden');
      
      // Wait for image to load then analyze
      previewImg.onload = () => {
        analyzeImage();
      };
    };
    
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    // Show loading
    preview.classList.add('hidden');
    loading.classList.remove('hidden');
    result.classList.add('hidden');

    try {
      // Check if TensorFlow is loaded
      if (typeof tf === 'undefined') {
        throw new Error('TensorFlow.js not loaded');
      }

      // Check if detector exists
      if (typeof window.aiDetector === 'undefined') {
        throw new Error('AI Detector not initialized');
      }

      // Create temporary image element for processing
      const img = new Image();
      img.src = currentImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Process image
      const analysisResult = await window.aiDetector.processImage(img);
      
      // Show results
      displayResults(analysisResult);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing image: ' + error.message);
      resetUI();
    }
  }

  function displayResults(analysisResult) {
    loading.classList.add('hidden');
    result.classList.remove('hidden');
    preview.classList.remove('hidden');

    const resultLabel = document.getElementById('resultLabel');
    const confidence = document.getElementById('confidence');
    const detailText = document.getElementById('detailText');
    const totalTiles = document.getElementById('totalTiles');
    const fakeTiles = document.getElementById('fakeTiles');
    const maxFake = document.getElementById('maxFake');

    // Set prediction label
    resultLabel.textContent = analysisResult.prediction;
    resultLabel.className = 'result-label ' + analysisResult.prediction.toLowerCase();

    // Set confidence
    const confidencePercent = (analysisResult.confidence * 100).toFixed(1);
    confidence.textContent = confidencePercent + '%';

    // Set detail text
    if (analysisResult.prediction === 'FAKE') {
      detailText.textContent = `This image appears to be AI-generated. ${analysisResult.strongFakeTiles} tiles (${(analysisResult.fakeRatio * 100).toFixed(2)}%) showed strong fake evidence, exceeding the ${(window.aiDetector.IMAGE_FAKE_PERCENTAGE * 100)}% threshold.`;
    } else {
      detailText.textContent = `This image appears to be real. Only ${analysisResult.strongFakeTiles} tiles (${(analysisResult.fakeRatio * 100).toFixed(2)}%) showed fake evidence, below the ${(window.aiDetector.IMAGE_FAKE_PERCENTAGE * 100)}% threshold required for a fake classification.`;
    }

    // Set stats
    totalTiles.textContent = analysisResult.totalTiles;
    fakeTiles.textContent = `${analysisResult.strongFakeTiles} (${(analysisResult.fakeRatio * 100).toFixed(2)}%)`;
    maxFake.textContent = (analysisResult.maxFakeProb * 100).toFixed(2) + '%';
  }

  function resetUI() {
    dropZone.classList.remove('hidden');
    preview.classList.add('hidden');
    loading.classList.add('hidden');
    result.classList.add('hidden');
    previewImg.src = '';
    currentImage = null;
    fileInput.value = '';
  }
});