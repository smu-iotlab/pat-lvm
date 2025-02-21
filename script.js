const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const imageInputs = document.querySelectorAll('input[type="file"]');
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
        const modelType = imageInput.id.replace('imageInput_', ''); // 获取 ModelType
        const originalImage = document.getElementById(`originalImage_${modelType}`); // 获取原始图像元素
        const resultImage = document.getElementById(`resultImage_${modelType}`); // 获取结果图像元素
        const executeButton = document.getElementById(`executeButton_${modelType}`); // 获取执行按钮

        reader.onload = async (e) => {
            originalImage.src = e.target.result; // 显示上传的图像
            resultImage.src = ''; // 清空结果图像

            executeButton.disabled = false; // 允许点击 "执行" 按钮

            // --- 点击 "执行" 按钮 ---
            executeButton.addEventListener('click', async () => {
                const upload_url = 'http://10.72.129.55:8000/upload?type=' + modelType;

                const isBackendReachable = await checkBackendStatus(upload_url);
                if (!isBackendReachable) {
                    alert("Backend not reachable. Please check the server.");
                    return;
                }

                // --- 上传图像到服务器 ---
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
                const result = executeData.result; // result 是 base64 编码的图像数据

                resultImage.src = 'data:image/png;base64,' + result;

            });
        };

        const img = new Image();
        img.onload = async () => {
            // canvas.width = img.width;
            // canvas.height = img.height;
            // ctx.drawImage(img, 0, 0);
        };
        img.src = e.target.result;
        reader.readAsDataURL(file);
    });
});

// Function to check backend status
async function checkBackendStatus(url) {
    try {
        const response = await fetch(url);
        return response.status === 200;
    } catch (error) {
        console.error("Error checking backend status:", error);
        return false;
    }
}
