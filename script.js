document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    const controlPanel = document.getElementById('controlPanel');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let compressedBlob = null;

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 文件输入变化
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // 质量滑块变化
    qualitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        qualityValue.textContent = `${value}%`;
        
        if (currentFile) {
            if (value === 100) {
                // 100% 时显示原图
                compressedImage.src = URL.createObjectURL(currentFile);
                compressedSize.textContent = `大小: ${(currentFile.size / (1024 * 1024)).toFixed(2)} MB`;
            } else {
                // 其他情况进行压缩
                compressImage(currentFile, value / 100);
            }
        }
    });

    // 下载按钮点击
    downloadBtn.addEventListener('click', () => {
        if (compressedBlob) {
            const url = URL.createObjectURL(compressedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_' + currentFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // 处理图片上传
    async function handleImageUpload(file) {
        currentFile = file;
        previewContainer.style.display = 'flex';
        controlPanel.style.display = 'block';

        // 显示原始图片
        originalImage.src = URL.createObjectURL(file);
        originalSize.textContent = `大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        // 获取当前滑块值
        const quality = qualitySlider.value / 100;
        if (quality === 1) {
            // 如果是100%，显示原图
            compressedImage.src = URL.createObjectURL(file);
            compressedSize.textContent = `大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            // 否则进行压缩
            await compressImage(file, quality);
        }
    }

    // 压缩图片
    async function compressImage(file, quality) {
        try {
            // 如果是100%质量，直接返回原图
            if (quality >= 1) {
                compressedBlob = file;
                compressedImage.src = URL.createObjectURL(file);
                compressedSize.textContent = `大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
                return;
            }

            const options = {
                maxSizeMB: file.size / (1024 * 1024) * quality, // 根据质量比例设置目标大小
                maxWidthOrHeight: 2048,
                useWebWorker: true,
                quality: quality,
                initialQuality: quality,
                alwaysKeepResolution: true,
                maxIteration: 20
            };

            compressedBlob = await window.imageCompression(file, options);
            
            // 如果压缩效果不明显，使用 Canvas 进行额外压缩
            if (compressedBlob.size >= file.size * quality) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise(resolve => img.onload = resolve);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // 使用较低质量进行压缩
                const dataUrl = canvas.toDataURL('image/jpeg', quality * 0.9);
                const response = await fetch(dataUrl);
                compressedBlob = await response.blob();
            }

            compressedImage.src = URL.createObjectURL(compressedBlob);
            compressedSize.textContent = `大小: ${(compressedBlob.size / (1024 * 1024)).toFixed(2)} MB`;
        } catch (error) {
            console.error('压缩失败:', error);
        }
    }

    // 拖拽上传支持
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007AFF';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#E5E5E5';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#E5E5E5';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });
}); 