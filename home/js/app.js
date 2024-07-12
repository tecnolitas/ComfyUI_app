const serverAddress = '127.0.0.1:8188';
const clientId = uuidv4();
let promptId = null;

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('image');
const fileSelectButton = document.getElementById('fileSelectButton');
const imagePreview = document.getElementById('imagePreview');
const submitContainer = document.getElementById('submit-container');
const downloadContainer = document.getElementById('download-container');
const downloadLink = document.getElementById('download-link');

// Evitar comportamientos por defecto de arrastrar y soltar
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
    document.body.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Resaltar el área de arrastre cuando se arrastra una imagen
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

// Manejar la imagen arrastrada y mostrarla
dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    handleFiles(files);
}

fileSelectButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', function(event) {
    const files = event.target.files;
    handleFiles(files);
});

function handleFiles(files) {
    imagePreview.innerHTML = ''; // Reset content

    [...files].forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
            submitContainer.style.display = 'flex'; // Mostrar el botón cuando se cargue una imagen
        };
        reader.readAsDataURL(file);
    });
}

document.getElementById('imageForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const imageFile = formData.get('image');
    const modifiedOutput = document.getElementById('modified-output');

    modifiedOutput.innerHTML = '<h3>Imagen Modificada</h3>';


    try {
        const uploadResponse = await uploadImage(imageFile);
        const promptWorkflow = await readWorkflowAPI();

        promptWorkflow["3"]["inputs"]["seed"] = Math.floor(Math.random() * 18446744073709551614) + 1;
        promptWorkflow["3"]["inputs"]["image"] = uploadResponse.name;

        promptId = await queuePrompt(promptWorkflow);
        console.log(`Prompt encolado con ID: ${promptId}`);

        const socket = new WebSocket(`ws://${serverAddress}/ws?clientId=${clientId}`);

        socket.onopen = function() {
            console.log('Conexión WebSocket establecida');
        };

        socket.onmessage = async function(event) {
            try {
                const messageString = event.data;
                console.log('Mensaje WebSocket recibido:', messageString);

                const message = JSON.parse(messageString);

                if (message.type === 'executed' && message.data.prompt_id === promptId) {
                    console.log('Ejecución completada para el ID del prompt:', message.data.prompt_id);

                    const images = message.data.output.images;
                    console.log('Imágenes:', images);

                    for (const image of images) {
                        const imageUrl = `http://${serverAddress}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder)}&type=${encodeURIComponent(image.type)}`;
                        console.log('Descargando imagen desde:', imageUrl);
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);

                        const img = document.createElement('img');
                        img.src = url;
                        modifiedOutput.appendChild(img);

                        downloadLink.href = url;
                        downloadLink.download = image.filename;
                        downloadLink.style.display = 'inline-block';
                        downloadContainer.style.display = 'block';
                    }
           
                }
            } catch (error) {
                console.error('Error al procesar el mensaje WebSocket:', error);
     
            }
        };

    } catch (error) {
        console.error('Error en el procesamiento:', error);
 
    }
});

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`http://${serverAddress}/upload/image`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Error al subir la imagen');
    }

    return response.json();
}

async function readWorkflowAPI() {
    const response = await fetch('/home/js/workflow_api.json');
    if (!response.ok) {
        throw new Error('Error al leer el archivo workflow_api.json');
    }
    return response.json();
}

async function queuePrompt(promptWorkflow) {
    const postData = JSON.stringify({ prompt: promptWorkflow, client_id: clientId });
    const response = await fetch(`http://${serverAddress}/prompt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: postData
    });

    if (!response.ok) {
        throw new Error('Error al encolar el prompt');
    }

    const result = await response.json();
    return result.prompt_id;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


