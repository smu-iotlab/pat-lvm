const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const imageInputs = document.querySelectorAll('input[type="file"]');
const canvases = document.querySelectorAll('canvas');
const executeButtons = document.querySelectorAll('button[id^="executeButton"]'); // 获取执行按钮

// 函数：切换标签
function switchTab(tabId) {
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// 添加事件监听器到 imageInputs
imageInputs.forEach(imageInput => {
    imageInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        const canvas_id = imageInput.id.replace('imageInput_', 'imageCanvas_');
        const canvas = document.getElementById(canvas_id);
        const modelType = canvas_id.replace('imageCanvas_', '');
        const executeButton = document.getElementById('executeButton_' + modelType);

        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // --- 上传图像到服务器 ---
                const upload_url = 'http://10.72.129.55:8000/upload?type=' + modelType;
                const uploadResponse = await fetch(upload_url, {
                    method: 'POST',
                    body: e.target.result // 发送图像数据到后端
                });

                const uploadData = await uploadResponse.json();
                if (uploadData.error) {
                    console.error("Error from backend (upload):", uploadData.error);
                    return;
                }

                // 获取图像路径
                const imagePath = uploadData.imagePath;

                // 启用 "执行" 按钮
                executeButton.disabled = false;

                // --- 点击 "执行" 按钮 ---
                executeButton.addEventListener('click', async () => {
                    // 发送请求到执行 API
                    const execute_url = 'http://10.72.129.55:8000/execute?imagePath=' + imagePath + '&type=' + modelType;

                    const executeResponse = await fetch(execute_url, {
                        method: 'POST',
                    });

                    const executeData = await executeResponse.json();
                    if (executeData.error) {
                        console.error("Error from backend (execute):", executeData.error);
                        return;
                    }

                    // 获取测试结果
                    const result = executeData.result;

                    // 在网页上显示测试结果
                    alert("Test Result: " + result); // 简单地使用 alert 显示结果
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
});
