async function main() {
    //
    // A1: Daten generieren
    //

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


    //
    // A2: Erstes Modell trainieren
    //

    // Modell erstellen
    const cleanModel = createModel();
    tfvis.show.modelSummary({name: 'Modell Architektur', tab:'Modell'}, cleanModel);

    // Model trainieren
    await trainModel(cleanModel, trainData, testData, 150);


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
// Daten in Tensoren umwandeln
//
function convertToTensor(data) {
    // tf.tidy räumt den Speicher nach der Ausführung automatisch auf
    return tf.tidy(() => {
        // x- und y-Werte aus den Objekten extrahieren
        const inputs = data.map(d => d.x);
        const labels = data.map(d => d.y);

        // 2D-Tensoren erstellen: [Anzahl der Beispiele, 1 Feature pro Beispiel]
        const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

        return {
            inputs: inputTensor,
            labels: labelTensor
        };
    });
}


//
// Modell-Architektur definieren
//
function createModel() {
    const model = tf.sequential(

    );

    // Input Layer
    model.add(tf.layers.dense({
        inputShape: [1], 
        units: 100, 
        activation: 'relu'
    }));

    // 1. Hidden Layer
    model.add(tf.layers.dense({
        units: 100, 
        activation: 'relu'
    }));

    // 2. Hidden Layer
    model.add(tf.layers.dense({
        units: 100,
        activation: 'relu'
    }));

    // Output Layer (Aktivierungsfunktion 'linear' ist der Standard, kann weggelassen oder explizit genannt werden)
    model.add(tf.layers.dense({
        units: 1, 
        activation: 'linear'
    }));

    // Modell kompilieren mit Optimizer und Loss-Funktion
    const optimizer = tf.train.adam(0.01);
    model.compile({
        optimizer: optimizer,
        loss: 'meanSquaredError'
    });

    return model;
}


//
// Modell trainieren
//
async function trainModel(model, trainData, testData, epochs) {
    console.log("Starte Training...");
    
    const trainTensors = convertToTensor(trainData);
    const testTensors = convertToTensor(testData);

    const history = await model.fit(trainTensors.inputs, trainTensors.labels, {
        epochs: epochs,
        batchSize: 32,
        // Wir übergeben die Testdaten hier nur, um den Loss im Visor zu beobachten.
        // WICHTIG: Sie werden NICHT zur Optimierung des Modells genutzt.
        validationData: [testTensors.inputs, testTensors.labels],
        callbacks: tfvis.show.fitCallbacks(
            { name: 'Training Performance', tab: 'Training' },
            ['loss', 'val_loss'],
            { height: 200, callbacks: ['onEpochEnd'] }
        )
    });

    // Speicher freigeben
    trainTensors.inputs.dispose();
    trainTensors.labels.dispose();
    testTensors.inputs.dispose();
    testTensors.labels.dispose();

    console.log("Training beendet.");
    return history;
}





//
// Aufrufen von main()
//
main();