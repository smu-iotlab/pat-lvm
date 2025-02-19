const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const imageInputs = document.querySelectorAll('input[type="file"]');
const canvases = document.querySelectorAll('canvas');

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

// 添加事件监听器到 imageInputs,
imageInputs.forEach(imageInput =>{
     imageInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        const canvas_id = imageInput.id.replace('imageInput','imageCanvas').replace('_vessel','').replace('_flux','') // 获取canvas的id
        const canvas = document.getElementById(canvas_id)
        const ctx = canvas.getContext('2d');
         const tab_type = canvas_id.replace('imageCanvas', '') // 获取类型
          let modelType = 'segmentation' // 默认是分割
        if (tab_type == '_vessel') {
            modelType = 'vessel_enhancement'
        } else if(tab_type == '_flux'){
            modelType ='flux_correction'
        }

        reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
             // 发送请求到后端 (将 `your_server_ip` 替换为你服务器的 IP)
            const backend_url = 'http://10.72.129.55:8000/process?type='+ modelType;
             const response = await fetch(backend_url, {
                method: 'POST',
                body: e.target.result, // 将图像数据发送到后端
            });
           const data = await response.json();
            if (data.error) {
                 console.error("Error from backend:", data.error);
                 return;
            }
             if(modelType == 'segmentation'){
               const mask = data.mask;  // 获取分割掩码
               drawMask(mask, canvas)
           } else{
                const image_data = data.image; // 获取增强后的图像或者校正后的图像数据
                drawEnhancedImage(image_data,canvas);
           }
        };
         img.src = e.target.result;
       };
    reader.readAsDataURL(file);
      });
});

function drawMask(mask, canvas) {
    // 在此处编写掩码绘制函数
    console.log("Received mask:", mask, "for canvas:",canvas.id); // 在此处编写掩码绘制函数
    const ctx = canvas.getContext('2d');
    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < mask.length; i++) {
          if(mask[i]==1){
               const index = i*4
              data[index]=255
              data[index+1]=0
              data[index+2]=0
             data[index+3]=125  // 设置透明度为 125
         }

    }
    ctx.putImageData(imageData, 0, 0);
}
function drawEnhancedImage(imageData, canvas){
     // 在此处编写绘制增强/校正后的图像的代码
    const ctx = canvas.getContext('2d');
     const width = canvas.width
    const height = canvas.height
     if(imageData && typeof imageData[0] != "number"){
          const new_width = imageData[0].length
          const new_height = imageData.length
          if (new_width == width && new_height == height) {
               const imgData = ctx.createImageData(width, height);
               for (let i = 0; i < height; i++) {
                   for (let j = 0; j < width; j++) {
                           const index = (i * width + j) * 4
                           imgData.data[index] = imageData[i][j][0]
                           imgData.data[index + 1] = imageData[i][j][1]
                           imgData.data[index + 2] = imageData[i][j][2]
                           imgData.data[index + 3] = 255
                     }
                }
              ctx.putImageData(imgData, 0, 0);
            }
           else{
              console.log("Received enhanced image data:",imageData, "for canvas:",canvas.id, ", but image size does not match")
           }
     }else{
            console.log("Received enhanced image data:",imageData, "for canvas:",canvas.id,", but image is incorrect");
     }
}