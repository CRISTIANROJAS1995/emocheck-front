const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const docxPath = path.join(__dirname, "Salud mental", "Modulo Salud Mental - EmoCheck (3) (1).docx");

console.log("Leyendo documento Word:", docxPath);

mammoth.extractRawText({ path: docxPath })
    .then(function(result) {
        const text = result.value;
        const messages = result.messages;

        console.log("=".repeat(80));
        console.log("CONTENIDO DEL DOCUMENTO:");
        console.log("=".repeat(80));
        console.log(text);

        if (messages.length > 0) {
            console.log("\n" + "=".repeat(80));
            console.log("MENSAJES/ADVERTENCIAS:");
            console.log("=".repeat(80));
            messages.forEach(msg => console.log(msg));
        }

        // Guardar el contenido en un archivo de texto para análisis
        fs.writeFileSync("documento-salud-mental.txt", text, "utf8");
        console.log("\n✅ Contenido guardado en 'documento-salud-mental.txt'");
    })
    .catch(function(error) {
        console.error("Error al leer el documento:", error);
    });