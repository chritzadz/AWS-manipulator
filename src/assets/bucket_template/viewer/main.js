
var url_id;
var fileName;

//<!---->

url_id = urlParam('id');
loadCSVFile();

findModelById(url_id).then(result => {
    fileName = result;
    writeValue(result);
});

function urlParam(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function writeValue(val) {
    fileName = val;
}

function loadCSVFile() {
    fetch('data.csv')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\r\n');
            const headers = rows[0].split(',');
            const dataArray = [];

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(',');
                const rowData = {};

                for (let j = 0; j < headers.length; j++) {
                    rowData[headers[j]] = row[j];
                }

                dataArray.push(rowData);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function findModelById(id) {
    return fetch('data.csv')
        .then(response => response.text())
        .then(data => {
            const rows = data.split('\r\n');
            const headers = rows[0].split(',');

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(',');
                const rowData = {};

                for (let j = 0; j < headers.length; j++) {
                    rowData[headers[j]] = row[j];
                }

                if (rowData['id'] === id.toString()) {
                    fileName = rowData['model'];
                    return rowData['model'];
                }
            }

            console.log('No matching ID found.');
            return null;
        })
        .catch(error => {
            console.error('Error:', error);
            return null;
        });
}

//<!---->

//<!---->

var startTime = Date.now();

var canvas = document.getElementById("renderCanvas");

var filePath = "models/";
var fileType = '.glb';

/* Scene */
const mainScene = function (modelName) {
    var scene = new BABYLON.Scene(engine);

    //#region : Lighting
    var light = new BABYLON.HemisphericLight("Hemispheric", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.25;
    //#endregion

    //#region : Arc Rotate Camera
    var camera = new BABYLON.ArcRotateCamera("Camera", radians(90), radians(90), 3, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, false);
    camera.allowUpsideDown = false;
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 5;
    camera.lowerBetaLimit = radians(0);
    camera.upperBetaLimit = radians(160);
    camera.wheelPrecision = 100;
    //#endregion

    // GUI
    var myGUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var loadingText = new BABYLON.GUI.TextBlock();
    loadingText.text = "Loading...";
    loadingText.color = "black";
    loadingText.fontSize = 24;
    loadingText.fontStyle = "bold";
    myGUI.addControl(loadingText);

    //#region : Load the model
    BABYLON.SceneLoader.ImportMesh("", filePath, fileName + fileType, scene, function (newMeshes) {
        camera.target = newMeshes[0];
        newMeshes[0].position = new BABYLON.Vector3(0, 0, 0);
        newMeshes[0].rotation = new BABYLON.Vector3(0, 0, 0);
        var scale = 0.01;
        newMeshes[0].scaling = new BABYLON.Vector3(scale, scale, scale);
        // Hide the loading text
        myGUI.removeControl(loadingText);
    });
    //#endregion

    scene.registerBeforeRender(function () { });
    return scene;
}

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
var scene = mainScene(fileName);

document.addEventListener('DOMContentLoaded', function () {

    function filePathWhenNotNull() {
        if (fileName !== undefined) {
            filePath += fileName + "/";
        } else if (Date.now() - startTime < 5000) {
            setTimeout(filePathWhenNotNull, 100);
        } else {
            setTimeout(filePathWhenNotNull, 100);
        }
    }

    filePathWhenNotNull();

    /* -------------------------------------------------- */

    function doWhenNotNull() {
        if (fileName !== undefined) {
            engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
            scene = mainScene(fileName);

            document.addEventListener('DOMContentLoaded', function () {
                engine.runRenderLoop(function () {
                    if (scene) {
                        scene.render();
                        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
                    }
                });
            });
        } else if (Date.now() - startTime < 5000) {
            setTimeout(doWhenNotNull, 100);
        } else {
            setTimeout(doWhenNotNull, 100);
        }
    }

    doWhenNotNull();

    engine.runRenderLoop(function () {
        if (scene) {
            scene.render();
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        }
    });

});

/* Resize */
window.addEventListener("resize", function () {
    engine.resize();
});

/* ---------- */

/* Methods */
function radians(degree) {
    var pi = Math.PI;
    return degree * (pi / 180);
}

//<!---->