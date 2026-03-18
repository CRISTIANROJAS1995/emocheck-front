const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

// Acepta el archivo como argumento o usa el de salud mental por defecto
const inputArg = process.argv[2];
const docxPath = inputArg ?
    path.join(__dirname, inputArg) :
    path.join(__dirname, "Salud mental", "Modulo Salud Mental - EmoCheck (3) (1).docx");

// Nombre de salida basado en el archivo de entrada
const baseName = path.basename(docxPath, path.extname(docxPath))
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
const outputFile = `documento-${baseName}.txt`;

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
            messages.forEach(msg => console.log(JSON.stringify(msg, null, 2)));
        }

        // Guardar el contenido en un archivo de texto para análisis
        fs.writeFileSync(outputFile, text, "utf8");
        console.log(`\n✅ Contenido guardado en '${outputFile}'`);
    })
    .catch(function(error) {
        console.error("Error al leer el documento:", error);
    });