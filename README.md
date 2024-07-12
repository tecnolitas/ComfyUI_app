El archivo app.js contiene la lógica principal de la aplicación web para manejar la carga y el procesamiento de imágenes. Aquí está la explicación detallada de su contenido:

##Variables Iniciales
```
const serverAddress = '127.0.0.1:8188';
const clientId = uuidv4();
let promptId = null;
```
*serverAddress: Dirección del servidor donde se realizarán las peticiones.
*clientId: Identificador único generado para el cliente.
*promptId: Variable para almacenar el ID del prompt.

##Elementos del DOM
```
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('image');
const fileSelectButton = document.getElementById('fileSelectButton');
const imagePreview = document.getElementById('imagePreview');
const submitContainer = document.getElementById('submit-container');
const downloadContainer = document.getElementById('download-container');
const downloadLink = document.getElementById('download-link');

```
*dropArea: Área para arrastrar y soltar imágenes.
*fileInput: Input de archivo para seleccionar imágenes.
*fileSelectButton: Botón para abrir el selector de archivos.
*imagePreview: Contenedor para la vista previa de la imagen.
*submitContainer: Contenedor del botón de envío.
*downloadContainer: Contenedor del enlace de descarga.
*downloadLink: Enlace para descargar la imagen procesada.

##Manejo de Eventos de Arrastrar y Soltar
```
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

```
*preventDefaults(e): Previene el comportamiento por defecto de los eventos.
*highlight(e): Resalta el área de arrastre.
*unhighlight(e): Elimina el resaltado del área de arrastre.

##Manejo de la Imagen Arrastrada y Seleccionada

```
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
```
*handleDrop(e): Maneja la imagen arrastrada.
*fileSelectButton: Abre el selector de archivos al hacer clic.
*fileInput: Maneja la imagen seleccionada desde el sistema de archivos.

##Procesamiento de Archivos
```
function handleFiles(files) {
    imagePreview.innerHTML = ''; // Reset content

    [...files].forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
        submitContainer.style.display = 'block';
    });
}

```
*handleFiles(files): Lee y muestra la vista previa de las imágenes seleccionadas.

##Envío de Imagen para Procesamiento
```
document.getElementById('imageForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    submitContainer.style.display = 'none';
    downloadContainer.style.display = 'none';
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    const files = fileInput.files;
    if (files.length > 0) {
        const file = files[0];
        try {
            const response = await uploadImage(file);
            promptId = response.prompt_id;

            const promptWorkflow = await readWorkflowAPI();
            const queueResponse = await queuePrompt(promptWorkflow);

            const socket = new WebSocket(`ws://${serverAddress}/ws/${promptId}`);
            socket.onmessage = function(event) {
                loader.style.display = 'none';
                const message = JSON.parse(event.data);

                if (message.type === 'result') {
                    const img = new Image();
                    img.src = message.result_url;
                    document.getElementById('modified-output').appendChild(img);
                    downloadLink.href = message.result_url;
                    downloadLink.download = 'image.png';
                    downloadLink.style.display = 'block';
                }
            };
        } catch (error) {
            console.error('Error:', error);
        }
    }
});

```
*submit: Maneja el envío del formulario, sube la imagen, procesa la imagen y maneja la respuesta del servidor.

##Funciones Auxiliares

```
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

    return response.json();
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

```
*uploadImage(file): Sube la imagen al servidor.
*readWorkflowAPI(): Lee el archivo workflow_api.json.
*queuePrompt(promptWorkflow): Encola el prompt para el procesamiento.
*uuidv4(): Genera un identificador único.

"# ComfyUI_app" 
