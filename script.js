async function main() {
    // Date laden
    let data = loadData();
    console.log("Daten geladen")
    // Falls noch nicht vorhanden, generieren
    if (!data) {
        console.log("Generiere neue Daten")
        data = generateData(100);
        saveData(data);
    }

    console.table(data);

    // Daten aufteilen
    const {trainData, testData} = splitData(data);


    // Daten verrauschen
    const noisyTrainData = addNoise(trainData);
    const noisyTestData = addNoise(testData);


    console.log("Trainingsdaten: ");
    console.table(trainData);
    console.log("Verrauschte Trainingsdaten: ");
    console.table(noisyTrainData);
    console.log("Testdaten: ");
    console.table(testData);
    console.log("Verrauschte Testdaten: ");
    console.table(noisyTestData);

}

//
// Vorgegebene Funktion
//
function realNumberFunction(x) {
    return 0.5*(x+0.8)*(x+1.8)*(x-0.2)*(x-0.3)*(x-1.9)+1;
}

//
// Daten erzeugen
//
function generateData(n) {
    let data = [];

    for (let i = 0; i < n; i++) {
        let x = Math.random() * 4 -2; // 4-Intervall verschoben nach links
        let y = realNumberFunction(x);
        data.push({x, y}); 
    }

    return data;
}

//
// Daten speichern
//
function saveData(data) {
    localStorage.setItem("dataset", JSON.stringify(data));
}


//
// Daten laden
//
function loadData() {
    const data = localStorage.getItem("dataset");
    return data ? JSON.parse(data) : null;
}

//
// Daten aufteilen
//
function splitData(data) {
    // Kopie erstellen, damit Original erhalten bleibt
    const shuffled = [...data];

    // Mischen (Fisher-Yates), damit das Modell nicht einseitig lernt
    for (let i = shuffled.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }

    const splitIndex = Math.floor(shuffled.length / 2);

    const trainData = shuffled.slice(0,splitIndex);
    const testData = shuffled.slice(splitIndex);

    return {trainData, testData};
}

//
// Daten verrauschen
//
function addNoise(data, variance = 0.05) {
    const std = Math.sqrt(variance);

    return data.map(p => ({
        x: p.x,
        y: p.y + gaussianRandom() * std
    }));
}

//
// Normal-verteiltes Rauschen
//
function gaussianRandom() {
    let u = 0, v = 0;

    // Zufallszahlen (0,1]
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2.0 * Math.log(u)) *
           Math.cos(2.0 * Math.PI * v);
}

//
// Aufrufen von main()
//
main();