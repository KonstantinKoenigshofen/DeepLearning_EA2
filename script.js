async function main() {
    //
    // A1: Daten generieren
    //

    ///*
    // Da die Funktion async ist, nutzen wir await
    const loadedData = await loadPreTrainedData();

    // Entpacken der geladenen Arrays
    const trainData = loadedData.trainData;
    const testData = loadedData.testData;
    const noisyTrainData = loadedData.noisyTrainData;
    const noisyTestData = loadedData.noisyTestData;
    //*/

    // Daten generieren
    /*
    const data = generateData(100);

    console.log("Neue Daten generiert:");
    console.table(data);


    // Daten aufteilen
    const {trainData, testData} = splitData(data);


    // Daten verrauschen
    const noisyTrainData = addNoise(trainData);
    const noisyTestData = addNoise(testData);
    //*/

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
    /*
    console.log("--- A2: Clean Model ---");
    const cleanModel = await getOrTrainModel('cleanModel', trainData, testData, 80);

    //
    // A3: Zweites Modell mit verrauschten Daten trainieren (Best-Fit)
    //

    //Modell erstellen
    console.log("--- A3: Best-Fit Model ---");
    const bestModel = await getOrTrainModel('bestFitModel', noisyTrainData, noisyTestData, 80);
        
    //
    // A4: Zweites Modell mit verrauschten Daten trainieren (Over-Fit)
    //

    //Modell erstellen
    console.log("--- A4: Over-Fit Model ---");
    const overfitModel = await getOrTrainModel('overfitModel', noisyTrainData, noisyTestData, 1000, 16);
    //*/

    // Laden von vor-trainierten Modellen
    ///*
    //
    // A2: Erstes Modell trainieren
    //
    const cleanModel = await loadPreTrainedModel('cleanModel');

    //
    // A3: Zweites Modell mit verrauschten Daten trainieren (Best-Fit)
    //
    const bestModel = await loadPreTrainedModel('bestFitModel');

    //
    // A4: Zweites Modell mit verrauschten Daten trainieren (Over-Fit)
    //
    const overfitModel = await loadPreTrainedModel('overfitModel');
    //*/

    //
    // Visualisierung
    //
    console.log("Starte Visualisierung...");

    // R1: Nur die Datensätze visualisieren 
    drawChart('chartR1_left', 'Daten ohne Rauschen', trainData, testData);
    drawChart('chartR1_right', 'Daten mit Rauschen', noisyTrainData, noisyTestData);

    // Hilfsfunktion, um Zeilen R2 bis R4 kompakt zu zeichnen
    function renderRow(model, dataTrain, dataTest, idLeft, idRight) {
        const resTrain = getPredictionsAndLoss(model, dataTrain);
        const resTest = getPredictionsAndLoss(model, dataTest);

        // Zeichnen der Linie über die entsprechenden Punkte
        drawChart(idLeft, 'Auf Trainingsdaten', resTrain.sortedData, [], resTrain.predPoints);
        document.getElementById(`loss${idLeft.replace('chart', '')}`).innerText = `MSE: ${resTrain.loss.toFixed(5)}`;

        drawChart(idRight, 'Auf Testdaten', [], resTest.sortedData, resTest.predPoints);
        document.getElementById(`loss${idRight.replace('chart', '')}`).innerText = `MSE: ${resTest.loss.toFixed(5)}`;
    }

    // R2: Clean Model auf unverrauschten Daten
    renderRow(cleanModel, trainData, testData, 'chartR2_left', 'chartR2_right');

    // R3: Best-Fit Model auf verrauschten Daten
    renderRow(bestModel, noisyTrainData, noisyTestData, 'chartR3_left', 'chartR3_right');

    // R4: Over-Fit Model auf verrauschten Daten
    renderRow(overfitModel, noisyTrainData, noisyTestData, 'chartR4_left', 'chartR4_right');

    console.log("Visualisierung abgeschlossen!");

    //await downloadDataset(trainData, testData, noisyTrainData, noisyTestData);
    //await downloadModels(cleanModel, bestModel, overfitModel);



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
// Hilfsfunktion: Datensatz einmalig als Datei herunterladen
//
function downloadDataset(trainData, testData, noisyTrainData, noisyTestData) {
    console.log("Lade Datensatz herunter...");
    
    
    const exportObject = {
        trainData: trainData,
        testData: testData,
        noisyTrainData: noisyTrainData,
        noisyTestData: noisyTestData
    };

    // In JSON umwandeln und downloaden
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject));
    const dlNode = document.createElement('a');
    dlNode.setAttribute("href", dataStr);
    dlNode.setAttribute("download", "dataset.json");
    document.body.appendChild(dlNode);
    dlNode.click();
    dlNode.remove();
}


//
// Vor-generierten Datensatz vom Server laden
//
async function loadPreTrainedData() {
    try {
        console.log("Lade Datensatz vom Server...");
        const response = await fetch('./dataset.json'); 
        const data = await response.json();
        console.log("Datensatz erfolgreich geladen!");
        return data;
    } catch (error) {
        console.error("Fehler beim Laden des Datensatzes:", error);
        alert("Datensatz konnte nicht geladen werden. Bitte Pfad prüfen.");
        return null;
    }
}


//
// Daten aufteilen
//
function splitData(data, splitRatio = 0.5) {
    // Kopie erstellen, damit das Original-Array unverändert bleibt
    const shuffled = [...data];

    // Daten mischen (Fisher-Yates-Algorithmus)
    // Das verhindert, dass das Modell Muster in der Reihenfolge lernt.
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
    }

    // Den Index für die Trennung berechnen
    // Beispiel: Bei 100 Datenpunkten und splitRatio 0.7 ergibt das 70.
    const splitIndex = Math.floor(shuffled.length * splitRatio);

    // Array an dem berechneten Index in zwei Teile zerschneiden
    // slice(0, splitIndex) nimmt die ersten 70 Elemente
    const trainData = shuffled.slice(0, splitIndex); 
    
    // slice(splitIndex) nimmt den gesamten Rest (die restlichen 30 Elemente)
    const testData = shuffled.slice(splitIndex);

    return { trainData, testData };
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

    // 1. Hidden Layer mit Input-Layer (InputShape)
    model.add(tf.layers.dense({
        inputShape: [1], 
        units: 100, 
        activation: 'relu'
    }));

    // 2. Hidden Layer
    model.add(tf.layers.dense({
        units: 100,
        activation: 'relu'
    }));

     // 3. Hidden Layer
     /*
    model.add(tf.layers.dense({
        units: 200,
        activation: 'sigmoid'
    }));//*/



    // Output Layer
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
async function trainModel(model, trainData, testData, epochs, tabName = 'Training', customBatchSize = 32) {
    console.log(`Starte Training für ${tabName}...`);
    
    const trainTensors = convertToTensor(trainData);
    const testTensors = convertToTensor(testData);

    const history = await model.fit(trainTensors.inputs, trainTensors.labels, {
        epochs: epochs,
        batchSize: customBatchSize,
        // Testdaten übergebn, um den Loss im Visor zu beobachten
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

    console.log(`Training für ${tabName} beendet.`);
    return history;
}


//
// Modell laden oder (falls nicht vorhanden) neu trainieren und speichern (Über localStorage; für Entwicklung)
//
// Um ie Modelle zu löschen: Entwicklertool -> Application -> Local Storage -> rechtsclick auf den link der Seite und Clear
//
async function getOrTrainModel(modelName, trainData, testData, epochs, customBatchSize = 32) {
    const savePath = `localstorage://${modelName}`;
    const historyKey = `history_${modelName}`;
    
    try {
        // Modell aus dem LocalStorage laden
        console.log(`Versuche ${modelName} zu laden...`);
        const model = await tf.loadLayersModel(savePath);

        // History laden und im Visor anzeigen
        const savedHistoryStr = localStorage.getItem(historyKey);
        if (savedHistoryStr) {
            const savedHistory = JSON.parse(savedHistoryStr);
            renderSavedHistory(savedHistory, `Geladen: ${modelName}`);
        }
        
        // Geladene Modelle müssen neu kompiliert werden, um den Loss zu berechnen
        const optimizer = tf.train.adam(0.01);
        model.compile({ optimizer: optimizer, loss: 'meanSquaredError' });
        
        console.log(`${modelName} erfolgreich geladen!`);
        return model;
        
    } catch (error) {
        // Wenn das Laden fehlschlägt, wird neu trainiert
        console.log(`${modelName} nicht gefunden. Erstelle und trainiere neu...`);
        
        const model = createModel();
        const history = await trainModel(model, trainData, testData, epochs, modelName, customBatchSize);
        
        // Modell speichern
        await model.save(savePath);

        localStorage.setItem(historyKey, JSON.stringify(history.history));

        console.log(`${modelName} und History wurde erfolgreich gespeichert unter ${savePath}`);
        
        return model;
    }
}

//
// Zeichnet den Trainingsverlauf aus gespeicherten Daten im TF Visor neu
//
function renderSavedHistory(historyData, tabName) {
    // Zahlen-Arrays in das Format [{x: epoche, y: loss}] umwandeln
    const lossValues = historyData.loss.map((val, index) => ({ x: index, y: val }));
    const valLossValues = historyData.val_loss.map((val, index) => ({ x: index, y: val }));

    // Definition, wo der Graph im Visor auftauchen soll
    const surface = { name: 'Trainingsverlauf', tab: tabName };

    // Liniendiagramm zeichnen
    tfvis.render.linechart(
        surface,
        { values: [lossValues, valLossValues], series: ['loss', 'val_loss'] },
        {
            xLabel: 'Epoche',
            yLabel: 'Loss (MSE)',
            height: 200
        }
    );
}





//
// Vorhersagen generieren und MSE berechnen
//
function getPredictionsAndLoss(model, data) {
    // Daten nach x-Werten sortieren, damit später eine durchgehende Linie gezeichnet werden kann
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    
    return tf.tidy(() => {
        const inputs = sortedData.map(d => d.x);
        const labels = sortedData.map(d => d.y);
        
        const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
        
        // Modell lässt Vorhersage treffen
        const predictions = model.predict(inputTensor);
        const predValues = predictions.dataSync(); // Tensor in JS-Array umwandeln
        
        // Loss (MSE) manuell berechnen für die Anzeige
        let loss = 0;
        for (let i = 0; i < labels.length; i++) {
            loss += Math.pow(labels[i] - predValues[i], 2);
        }
        loss = loss / labels.length;
        
        // Vorhersagen in das Format für Chart.js bringen [{x, y}]
        const predPoints = inputs.map((xVal, i) => ({
            x: xVal,
            y: predValues[i]
        }));
        
        return { sortedData, predPoints, loss };
    });
}


//
// Diagramm zeichnen mit Chart.js
//
function drawChart(canvasId, title, trainData, testData, predData = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const datasets = [
        {
            label: 'Trainingsdaten',
            data: trainData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blau
            type: 'scatter'
        },
        {
            label: 'Testdaten',
            data: testData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)', // Rot
            type: 'scatter'
        }
    ];

    // Wenn Vorhersagen übergeben wurden, werden sie als Linie hinzugefügt
    if (predData) {
        datasets.push({
            label: 'Modell Vorhersage',
            data: predData,
            borderColor: 'rgba(75, 192, 192, 1)', // Grün
            borderWidth: 2,
            type: 'line',
            fill: false,
            pointRadius: 0 // Versteckt die einzelnen Punkte auf der Linie
        });
    }

    new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: title }
            },
            scales: {
                x: { type: 'linear', position: 'bottom', min: -2, max: 2 }
            }
        }
    });
}

// Funktion fürs herunterladen der Modelle
async function downloadModels(cleanModel, bestModel, overfitModel) {
    console.log("Starte Download der Modelle...");
    
    await cleanModel.save('downloads://cleanModel');
    await bestModel.save('downloads://bestFitModel');
    await overfitModel.save('downloads://overfitModel');
    
    console.log("Downloads abgeschlossen!");
}

//
// Vor-trainiertes Modell vom Web-Server(Github) laden
//
async function loadPreTrainedModel(modelName) {
    // Der Pfad weist auf den relativen 'models' Ordner auf dem Server
    const modelUrl = `./models/${modelName}.json`;
    
    try {
        console.log(`Lade ${modelName} vom Server...`);
        
        const model = await tf.loadLayersModel(modelUrl);
        
        // Modell kompilieren, damit später der Loss berechnet werden kann
        const optimizer = tf.train.adam(0.01);
        model.compile({ optimizer: optimizer, loss: 'meanSquaredError' });
        
        console.log(`${modelName} erfolgreich geladen!`);
        return model;
    } catch (error) {
        console.error(`Fehler beim Laden von ${modelName}:`, error);
        alert(`Das Modell ${modelName} konnte nicht geladen werden. Bitte überprüfe die Pfade.`);
        return null;
    }
}



//
// Aufrufen von main()
//
main();