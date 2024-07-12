El archivo app.js contiene la lógica principal de la aplicación web para manejar la carga y el procesamiento de imágenes. Aquí está la explicación detallada de su contenido:

Variables Iniciales
javascript
Copiar código
const serverAddress = '127.0.0.1:8188';
const clientId = uuidv4();
let promptId = null;
serverAddress: Dirección del servidor donde se realizarán las peticiones.
clientId: Identificador único generado para el cliente.
promptId: Variable para almacenar el ID del prompt.
