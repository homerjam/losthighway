var effects = true;
var controlsEnabled = false;

var options = {
    roadSpeed: 150,
    textHoldDelay: 2000,
    textArray: ['Welcome to Infinite Highway', 'type your message and hit enter']
};

var input = '', hasInput = false;

$.fn.ready(function() {

    $(document).on('keydown', function(e) {
        // console.log(e.keyCode);

        if (e.keyCode === 8) {
            e.preventDefault();
        }

        switch (e.keyCode) {
            case 187:
                gainNode.gain.value = gainNode.gain.value < 0 ? gainNode.gain.value + 0.2 : 0;
                break;
            case 189:
                gainNode.gain.value = gainNode.gain.value > -1 ? gainNode.gain.value - 0.2 : -1;
                break;
        }

        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90) || e.keyCode === 32) {
            input += String.fromCharCode(e.keyCode);
        }

        if (e.keyCode === 8) {
            input = input.split('');
            input.splice(-1, 1);
            input = input.join('');
        }

        if (e.keyCode === 13) {
            console.log(input);

            if (!hasInput) {
                hasInput = true;

                options.textArray = [input];

            } else {
                options.textArray.push(input);
            }

            textCounter = options.textArray.length - 1;

            input = '';
        }

    });

});

var camera, scene, renderer, controls;

var composer, renderPass, copyPass;

var light1, light2;

var slabs = {
    slabs: [],
    y: 0,
    w: 1500,
    h: 1500,
    count: 300,
    texturePath: 'img3',
    textureFormat: 'jpg',
    textureCount: 1,
    geometry: null,
    materials: {}
};

var linesGroup;

var lines = {
    lines: [],
    y: 2,
    w: 30,
    h: 750,
    count: 300,
    geometry: null
};

var text = {
    lineSpacing: 10,
    size: 100,
    posY: 400,
    lineChars: 15,
    inStartZ: -10000,
    inEndZ: -2000,
    outStartZ: -2000,
    outEndZ: 0,
    inDuration: 2000,
    outDuration: 200,
    inDelay: 2000,
    outDelay: 2000
}

var cam = {
    rotateX: Math.PI / 30,
    posY: 60
};

var roadGroup;

var road = {
    speed: options.roadSpeed,
    speedIncrement: 2,
    speedDirectionMax: 50
};

var camPos = {
    speedX: 1.3,
    maxX: 10,
    speedY: 0.3,
    maxY: 5
};

var camRot = {
    speedX: 0.1,
    maxX: 10,
    speedY: 0.2,
    maxY: 20
};

var potholes = {
    potholes: [],
    y: 1,
    textures: [{
        filename: 'pothole0.png',
        w: 1100,
        h: 1400,
        map: null
    }]
};

var euler = new THREE.Euler(-Math.PI / 2, 0, 0, 'XYZ');

window.addEventListener('load', function() {
    init();
    animate();
});

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

var context, bufferLoader, gainNode;

function finishedLoading(bufferList) {
    var source1 = context.createBufferSource();
    source1.buffer = bufferList[0];
    source1.loop = true;
    source1.connect(context.destination);
    source1.start(0);

    gainNode = context.createGain();
    gainNode.gain.value = -0.6;

    source1.connect(gainNode);

    gainNode.connect(context.destination);
}

function initSound() {
    bufferLoader = new BufferLoader(
        context, [
            'mp3/deranged.mp3',
        ],
        finishedLoading
    );

    bufferLoader.load();
}

function init() {

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.rotation.x = cam.rotateX;
    camera.position.y = cam.posY;
    camera.position.z = 0;
    camera.setLens(35);

    controls = new THREE.TrackballControls(camera);
    controls.target.set(0, 0, 0);

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [65, 83, 68];

    controls.addEventListener('change', render);

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    scene.add(new THREE.AmbientLight(0xffffff));

    light1 = new THREE.SpotLight(0xffffff, 50, 2000);
    light1.target.position.x = -400;
    light1.target.position.y = 50;
    light1.exponent = 120;
    scene.add(light1);

    light2 = new THREE.SpotLight(0xffffff, 50, 2000);
    light2.target.position.x = 400;
    light2.target.position.y = 50;
    light2.exponent = 120;
    scene.add(light2);

    light1.position.x = -60;
    light2.position.x = 60;
    light1.position.y = light2.position.y = 50;
    light1.position.z = light2.position.z = 0;
    light1.target.position.z = light2.target.position.z = -3000;

    var sphere = new THREE.SphereGeometry(10, 16, 8);

    // var l1 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0xff0000}));
    // l1.position = light1.position;
    // scene.add(l1);

    // var l2 = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x00ff00}));
    // l2.position = light2.position;
    // scene.add(l2);

    var i;

    for (i = 0; i < slabs.textureCount; i++) {
        var slabMaterial = new THREE.MeshPhongMaterial({
            ambient: 0x444444,
            specular: 0x000000,
            shading: THREE.SmoothShading,
            map: THREE.ImageUtils.loadTexture(slabs.texturePath + '/slab' + i + '.' + slabs.textureFormat)
        });
        slabMaterial.map.needsUpdate = true;
        slabs.materials[i] = slabMaterial;
    }

    slabs.geometry = new THREE.PlaneGeometry(slabs.w, slabs.h);

    roadGroup = new THREE.Object3D();

    var randomTextureInt = function() {
        return random(3, 15);
    };

    var n = 0;
    var tI = randomTextureInt();

    for (i = 0; i < slabs.count; i++) {
        t = 0;

        if (n === tI) {
            n = 0;
            tI = randomTextureInt();
            t = random(0, slabs.textureCount - 1);
        }


        var slab = new THREE.Mesh(slabs.geometry, slabs.materials[t]);
        slab.doubleSided = true;
        slab.rotation.x = -Math.PI / 2;
        // slab.position.applyEuler(euler);
        slab.position.y = slabs.y;
        slab.position.z = 0 - (i * slabs.h);
        slabs.slabs.push(slab);
        roadGroup.add(slab);

        n++;
    }

    scene.add(roadGroup);

    linesGroup = new THREE.Object3D();

    lines.material = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0xffff00,
        ambient: 0x444444,
        shading: THREE.SmoothShading,
        map: THREE.ImageUtils.loadTexture('img/rough_yellow.jpg'),
        transparent: true,
        opacity: 0.8
    });

    lines.geometry = new THREE.PlaneGeometry(lines.w, lines.h);

    for (i = 0; i < lines.count; i++) {
        var line = new THREE.Mesh(lines.geometry, lines.material);
        line.doubleSided = true;
        line.rotation.x = -Math.PI / 2;
        // line.position.applyEuler(euler);
        line.position.y = lines.y;
        line.position.z = 0 - (i * (lines.h * 2));
        lines.lines.push(line);
        linesGroup.add(line);
    }

    roadGroup.add(linesGroup);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(scene.fog.color, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;

    document.body.appendChild(renderer.domElement);

    if (effects) {
        composer = new THREE.EffectComposer(renderer);
        renderPass = new THREE.RenderPass(scene, camera);
        copyPass = new THREE.ShaderPass(THREE.CopyShader);
        composer.addPass(renderPass);

        vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        vignettePass.uniforms.darkness.value = 1.05;
        vignettePass.uniforms.offset.value = 1.5;
        composer.addPass(vignettePass);

        focusPass = new THREE.ShaderPass(THREE.FocusShader);
        focusPass.uniforms.sampleDistance.value = 0.15;
        focusPass.uniforms.waveFactor.value = 0.001;
        composer.addPass(focusPass);

        composer.addPass(copyPass);
        copyPass.renderToScreen = true;

        tweakFocus(true);
    }

    loadPotholes();

    generatePothole();

    runTextTweenIn();

    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();

        initSound();

    } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
    }
}

var textGroup, textMaterial, textCounter = 0;

textMaterial = new THREE.MeshPhongMaterial({
    color: 0xffff00,
    specular: 0xffff00,
    ambient: 0xffff00,
    shading: THREE.FlatShading,
    map: THREE.ImageUtils.loadTexture('img/rough_yellow.jpg'),
    transparent: true,
    opacity: 0.8
});

function makeText(textString) {
    if (textGroup) {
        scene.remove(textGroup);
    }

    textGroup = new THREE.Object3D();
    textGroup.position.z = Infinity;
    scene.add(textGroup);

    var textStringArray = textString.split(' ');

    var linesCount = Math.ceil(textString.length / text.lineChars);

    var lineCounter = 0,
        wordCounter = 0;

    var lines = [];

    textStringArray.forEach(function(word, i) {
        if (wordCounter > textStringArray.length / linesCount || word.length > Math.floor(text.lineChars * 0.66)) {
            lineCounter++;
            wordCounter = 0;
        }

        if (lines[lineCounter] === undefined) {
            lines[lineCounter] = [];
        }

        lines[lineCounter].push(word);

        wordCounter++;
    });

    var totalLineHeight = 0;

    lines.reverse().forEach(function(line, i) {
        var textGeo = new THREE.TextGeometry(line.join(' '), {
            size: text.size,
            height: 0,
            font: "boston traffic italic",
            weight: "normal",
            style: "normal",
            bevelEnabled: false,
            curveSegments: 2
        });

        textGeo.computeBoundingBox();
        textGeo.computeVertexNormals();

        var textMesh = new THREE.Mesh(textGeo, textMaterial);
        textMesh.position.x = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
        textMesh.position.y = totalLineHeight;
        textMesh.rotation.y = Math.PI * 2;
        textMesh.rotation.z = Math.PI / 30;
        textGroup.add(textMesh);

        totalLineHeight += Math.abs(textMesh.geometry.boundingBox.min.y - textMesh.geometry.boundingBox.max.y) + text.lineSpacing;
    });

    textGroup.position.y = text.posY - (totalLineHeight / 2);

    textCounter = textCounter === options.textArray.length - 1 ? 0 : textCounter + 1;
}

var textTweenIn, textTweenOut;

var runTextTweenIn = function() {
    makeText(options.textArray[textCounter]);

    textTweenIn = new TWEEN.Tween({
        z: text.inStartZ
    })
        .to({
            z: text.inEndZ
        }, text.inDuration)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(function() {
            textGroup.position.z = this.z;
        })
        .onComplete(function() {
            runTextTweenOut();
        })
        .start();
};

var runTextTweenOut = function() {
    textTweenOut = new TWEEN.Tween({
        z: text.outStartZ
    })
        .to({
            z: text.outEndZ
        }, text.outDuration)
        .delay(text.outDelay)
        .onUpdate(function() {
            textGroup.position.z = this.z;
        })
        .onComplete(function() {
            setTimeout(function() {
                runTextTweenIn();
            }, text.inDelay);
        })
        .start();
};

var progress = 0;

var dist = 0,
    prevDist = 0,
    textLeaving = false,
    textHoldTimeout = null;

var camPosDirectionX, camPosOffsetX = 0,
    camPosOffsetTargetX = 0;
var camPosDirectionY, camPosOffsetY = 0,
    camPosOffsetTargetY = 0;

var camRotDirectionX, camRotOffsetX = 0,
    camRotOffsetTargetX = 0;
var camRotDirectionY, camRotOffsetY = 0,
    camRotOffsetTargetY = 0;

var speedDirection, speedOffset = 0,
    speedTarget = 0;

function animate() {
    requestAnimationFrame(animate);

    if (controlsEnabled) {
        controls.update();

    } else {

        if (camPosOffsetX < camPosOffsetTargetX && camPosDirectionX === 'right') {
            camPosOffsetX += camPos.speedX;
        } else if (camPosOffsetX > camPosOffsetTargetX && camPosDirectionX === 'left') {
            camPosOffsetX -= camPos.speedX;
        } else if (camPosDirectionX === 'right') {
            camPosOffsetTargetX = -random(0, camPos.maxX);
            camPosDirectionX = 'left';
        } else {
            camPosOffsetTargetX = random(0, camPos.maxX);
            camPosDirectionX = 'right';
        }

        if (camPosOffsetY < camPosOffsetTargetY && camPosDirectionY === 'up') {
            camPosOffsetY += camPos.speedY;
        } else if (camPosOffsetY > camPosOffsetTargetY && camPosDirectionY === 'down') {
            camPosOffsetY -= camPos.speedY;
        } else if (camPosDirectionY === 'up') {
            camPosOffsetTargetY = -random(0, camPos.maxY);
            camPosDirectionY = 'down';
        } else {
            camPosOffsetTargetY = random(0, camPos.maxY);
            camPosDirectionY = 'up';
        }

        if (camRotOffsetX < camRotOffsetTargetX && camRotDirectionX === 'up') {
            camRotOffsetX += camRot.speedX;
        } else if (camRotOffsetX > camRotOffsetTargetX && camRotDirectionX === 'down') {
            camRotOffsetX -= camRot.speedX;
        } else if (camRotDirectionX === 'up') {
            camRotOffsetTargetX = -random(0, camRot.maxX);
            camRotDirectionX = 'down';
        } else {
            camRotOffsetTargetX = random(0, camRot.maxX);
            camRotDirectionX = 'up';
        }

        if (camRotOffsetY < camRotOffsetTargetY && camRotDirectionY === 'right') {
            camRotOffsetY += camRot.speedY;
        } else if (camRotOffsetY > camRotOffsetTargetY && camRotDirectionY === 'left') {
            camRotOffsetY -= camRot.speedY;
        } else if (camRotDirectionY === 'right') {
            camRotOffsetTargetY = -random(0, camRot.maxY);
            camRotDirectionY = 'left';
        } else {
            camRotOffsetTargetY = random(0, camRot.maxY);
            camRotDirectionY = 'right';
        }

        if (speedOffset < speedTarget && speedDirection === 'faster') {
            speedOffset += road.speedIncrement;
        } else if (speedOffset > speedTarget && speedDirection === 'slower') {
            speedOffset -= road.speedIncrement;
        } else if (speedDirection === 'faster') {
            speedTarget = -random(0, road.speedIncrementMax);
            speedDirection = 'slower';
        } else {
            speedTarget = random(0, road.speedIncrementMax);
            speedDirection = 'faster';
        }

        roadGroup.rotation.x = (camRotOffsetX / 100000);
        roadGroup.rotation.y = (camRotOffsetY / 100000);

        // var euler2 = new THREE.Euler( camRotOffsetX / 100000, camRotOffsetY / 100000, 0, 'XYZ' );
        // roadGroup.position.applyEuler(euler2);

        roadGroup.position.x = camPosOffsetX;
        roadGroup.position.y = camPosOffsetY;

        roadGroup.position.z += road.speed + speedOffset;

        dist = Math.floor(roadGroup.position.z / slabs.h);

        if (dist > prevDist) {
            progress++;

            if (progress > Math.floor(slabs.count * 0.8)) {
                console.log('loop');
                progress = prevDist = 0;
                roadGroup.position.z = 0;

            } else {
                prevDist = dist;
            }
        }

        TWEEN.update();

        if (effects) {
            composer.render(0.1);
        } else {
            render();
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function tweakFocus(on) {
    setTimeout(function() {
        var tweakInterval = setInterval(function() {
            if (on) {
                focusPass.uniforms.waveFactor.value += 0.01;
            } else {
                focusPass.uniforms.waveFactor.value -= 0.01;
            }

            if (focusPass.uniforms.waveFactor.value >= 0.1) {
                on = false;
            } else if (focusPass.uniforms.waveFactor.value <= 0.001) {
                clearInterval(tweakInterval);
            }
        }, 100);

        tweakFocus(true);

    }, random(10000, 40000));
}

function loadPotholes() {
    for (var i in potholes.textures) {
        potholes.textures[i].map = THREE.ImageUtils.loadTexture('img/' + potholes.textures[i].filename);
    }
}

function generatePothole() {
    setTimeout(function() {
        cleanupPotholes();

        if (potholes.potholes.length < 50) {
            var texture = potholes.textures[random(0, potholes.textures.length - 1)];

            var potholeMaterial = new THREE.MeshPhongMaterial({
                ambient: 0x444444,
                specular: 0x000000,
                shading: THREE.SmoothShading,
                map: texture.map,
                transparent: true,
                opacity: 0.8
            });

            var potholeScale = random(3, 6);

            var pw = (texture.w / potholeScale);
            var ph = (texture.h / potholeScale);
            potholeGeometry = new THREE.PlaneGeometry(pw, ph);

            var pothole = new THREE.Mesh(potholeGeometry, potholeMaterial);

            pothole.rotation.x = -Math.PI / 2;
            // pothole.position.applyEuler(euler);

            var px = random(-((slabs.w * 0.5) + pw), (slabs.w * 0.5) - pw);
            pothole.position.x = px;
            pothole.position.y = potholes.y;
            pothole.position.z = -roadGroup.position.z - 6000;

            potholes.potholes.push(pothole);
            roadGroup.add(pothole);
        }

        generatePothole();

    }, random(500, 2000));
}

function cleanupPotholes() {
    for (var i = potholes.potholes.length - 1; i > -1; i--) {
        var pothole = potholes.potholes[i];
        if (pothole !== undefined) {
            if (-roadGroup.position.z > pothole.position.z) {
                potholes.potholes.splice(i, 1);
                roadGroup.remove(pothole);
            }
        }
    }
}

function random(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

function difference(a, b) {
    return Math.abs(a - b);
}
