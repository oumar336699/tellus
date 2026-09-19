// TELLUS Signature Module
// Handles digital signature functionality for Super Admin

const SignaturePad = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    signatureData: null,

    // Initialize Signature Pad
    init: function() {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Setup canvas size
        this.setupCanvasSize();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup clear button
        const clearButton = document.querySelector('.clear-signature-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clear());
        }
    },

    // Setup Canvas Size
    setupCanvasSize: function() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = 200;
        
        // Set default styles
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    },

    // Setup Event Listeners
    setupEventListeners: function() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    },

    // Handle Resize
    handleResize: function() {
        // Save current signature
        const currentData = this.getData();
        
        // Resize canvas
        this.setupCanvasSize();
        
        // Restore signature if exists
        if (currentData) {
            this.setData(currentData);
        }
    },

    // Get Position
    getPosition: function(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    // Start Drawing
    startDrawing: function(event) {
        this.isDrawing = true;
        const pos = this.getPosition(event);
        this.lastX = pos.x;
        this.lastY = pos.y;
    },

    // Draw
    draw: function(event) {
        if (!this.isDrawing) return;

        const pos = this.getPosition(event);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    },

    // Stop Drawing
    stopDrawing: function() {
        this.isDrawing = false;
    },

    // Clear Canvas
    clear: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.signatureData = null;
    },

    // Get Signature Data
    getData: function() {
        if (this.isCanvasBlank()) {
            return null;
        }
        
        return this.canvas.toDataURL('image/png');
    },

    // Set Signature Data
    setData: function(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0);
            this.signatureData = dataUrl;
        };
        img.src = dataUrl;
    },

    // Check if Canvas is Blank
    isCanvasBlank: function() {
        const pixelBuffer = new Uint32Array(
            this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.buffer
        );
        
        return !pixelBuffer.some(color => color !== 0);
    },

    // Validate Signature
    validateSignature: function() {
        const data = this.getData();
        
        if (!data) {
            return {
                valid: false,
                message: 'Veuillez signer avant de continuer'
            };
        }

        // Check signature complexity (number of strokes)
        const complexity = this.calculateSignatureComplexity();
        
        if (complexity < 50) {
            return {
                valid: false,
                message: 'Signature trop simple. Veuillez signer plus clairement.'
            };
        }

        return {
            valid: true,
            data: data
        };
    },

    // Calculate Signature Complexity
    calculateSignatureComplexity: function() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let complexity = 0;
        
        // Count non-transparent pixels
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Alpha channel
                complexity++;
            }
        }
        
        return complexity;
    },

    // Compare Signatures
    compareSignatures: function(signature1, signature2) {
        // This is a simplified comparison
        // In production, you would use more sophisticated algorithms
        
        const img1 = new Image();
        const img2 = new Image();
        
        return new Promise((resolve) => {
            let loadedCount = 0;
            
            img1.onload = () => {
                loadedCount++;
                if (loadedCount === 2) {
                    resolve(this.performComparison(img1, img2));
                }
            };
            
            img2.onload = () => {
                loadedCount++;
                if (loadedCount === 2) {
                    resolve(this.performComparison(img1, img2));
                }
            };
            
            img1.src = signature1;
            img2.src = signature2;
        });
    },

    // Perform Comparison
    performComparison: function(img1, img2) {
        // Create temporary canvases for comparison
        const canvas1 = document.createElement('canvas');
        const canvas2 = document.createElement('canvas');
        
        canvas1.width = this.canvas.width;
        canvas1.height = this.canvas.height;
        canvas2.width = this.canvas.width;
        canvas2.height = this.canvas.height;
        
        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');
        
        ctx1.drawImage(img1, 0, 0);
        ctx2.drawImage(img2, 0, 0);
        
        const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data;
        const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data;
        
        let matchingPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data1.length; i += 4) {
            // Compare alpha channels
            if (data1[i + 3] > 0 || data2[i + 3] > 0) {
                totalPixels++;
                
                // Compare RGB values
                const rDiff = Math.abs(data1[i] - data2[i]);
                const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
                const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
                
                if (rDiff < 30 && gDiff < 30 && bDiff < 30) {
                    matchingPixels++;
                }
            }
        }
        
        const similarity = totalPixels > 0 ? (matchingPixels / totalPixels) * 100 : 0;
        
        return {
            similarity: similarity,
            match: similarity > 70 // 70% threshold
        };
    },

    // Save Signature to Storage
    saveSignature: async function(signatureData) {
        try {
            if (typeof Preferences !== 'undefined') {
                await Preferences.set({
                    key: 'admin_signature',
                    value: signatureData
                });
                return true;
            }
        } catch (error) {
            console.error('Error saving signature:', error);
            return false;
        }
    },

    // Load Signature from Storage
    loadSignature: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                const signature = await Preferences.get({ key: 'admin_signature' });
                if (signature.value) {
                    this.setData(signature.value);
                    return signature.value;
                }
            }
        } catch (error) {
            console.error('Error loading signature:', error);
        }
        return null;
    },

    // Clear Saved Signature
    clearSavedSignature: async function() {
        try {
            if (typeof Preferences !== 'undefined') {
                await Preferences.remove({ key: 'admin_signature' });
                return true;
            }
        } catch (error) {
            console.error('Error clearing signature:', error);
            return false;
        }
    },

    // Export Signature as Image
    exportSignature: function(format = 'png') {
        const data = this.getData();
        if (!data) {
            TellusApp.showError('Aucune signature à exporter');
            return null;
        }

        const link = document.createElement('a');
        link.download = `signature_${Date.now()}.${format}`;
        link.href = data;
        link.click();
        
        return data;
    },

    // Convert Signature to Base64
    toBase64: function() {
        return this.getData();
    },

    // Create Signature from Base64
    fromBase64: function(base64Data) {
        this.setData(base64Data);
    }
};

// Make SignaturePad available globally
window.SignaturePad = SignaturePad;