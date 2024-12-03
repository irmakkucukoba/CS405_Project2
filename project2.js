/**
 * @Instructions
 *      @task1 : Complete the setTexture function to handle non power of 2 sized textures
 *      @task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3:
 *      @task4:
 *      setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions
 * Irmak Küçükoba 31262
 */

function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var trans1 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];
    var rotatXCos = Math.cos(rotationX);
    var rotatXSin = Math.sin(rotationX);

    var rotatYCos = Math.cos(rotationY);
    var rotatYSin = Math.sin(rotationY);

    var rotatx = [
        1, 0, 0, 0,
        0, rotatXCos, -rotatXSin, 0,
        0, rotatXSin, rotatXCos, 0,
        0, 0, 0, 1
    ]

    var rotaty = [
        rotatYCos, 0, -rotatYSin, 0,
        0, 1, 0, 0,
        rotatYSin, 0, rotatYCos, 0,
        0, 0, 0, 1
    ]

    var test1 = MatrixMult(rotaty, rotatx);
    var test2 = MatrixMult(trans1, test1);
    var mvp = MatrixMult(projectionMatrix, test2);

    return mvp;
}

class MeshDrawer {
    
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

        this.colorLoc = gl.getUniformLocation(this.prog, 'color');

        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();

        this.numTriangles = 0;

        /**
         * @Task2 : Initialize the required variables for lighting here
         */
        // Get uniform locations for lighting
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');

        // Get attribute location for normals
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

        // Create buffer for normals
        this.normalBuffer = gl.createBuffer();
        this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
        this.setSpecularLight(0.5); // Set initial specular intensity to 0.5

        this.hasTexture2Loc = gl.getUniformLocation(this.prog, 'hasTexture2');
        this.blendTexturesLoc = gl.getUniformLocation(this.prog, 'blendTextures');

        // Initialize uniforms
        gl.useProgram(this.prog);
        gl.uniform1i(this.hasTexture2Loc, 0); // No second texture initially
        gl.uniform1i(this.blendTexturesLoc, 0); // Blending off initially
    }

    setSpecularLight(intensity) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.specularIntensityLoc, intensity);
    }

    setMesh(vertPos, texCoords, normalCoords) {
        // Bind and buffer vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Bind and buffer texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Bind and buffer normal vectors
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
    }

    setTexture2(img) {
        this.texture2 = gl.createTexture(); // Store texture2 as a class property
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);

        // Set the texture image data
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img);

        // Set texture parameters
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        // Bind the texture to texture unit 1
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);

        // Set the sampler2D uniform 'tex2' to use texture unit 1
        gl.useProgram(this.prog);
        const sampler2Loc = gl.getUniformLocation(this.prog, 'tex2');
        gl.uniform1i(sampler2Loc, 1);

        // Indicate that the second texture is now available
        gl.uniform1i(this.hasTexture2Loc, 1);
    }

    setBlendTextures(blend) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.blendTexturesLoc, blend ? 1 : 0);
    }

   
    draw(trans) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        // Vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        // Texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        // Update light position based on key inputs
        updateLightPos();

        // Pass the light position to the shader
        gl.uniform3f(this.lightPosLoc, lightX, lightY, 10.0); // Adjust Z as needed

        // Bind textures before drawing
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }
        if (this.texture2) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture2);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        this.texture = gl.createTexture(); // Store texture as a class property
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set the texture image data
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img);

        // Set texture parameters
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const sampler = gl.getUniformLocation(this.prog, 'tex');
        gl.uniform1i(sampler, 0);
    }

    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexLoc, show);
    }

    enableLighting(show) {
       
        gl.useProgram(this.prog);
        gl.uniform1i(this.enableLightingLoc, show ? 1 : 0);
    }

    setAmbientLight(ambient) {
    
        gl.useProgram(this.prog);
        gl.uniform1f(this.ambientLoc, ambient);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

    if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
    }
    return dst;
}

// Vertex shader source code
const meshVS = `
            attribute vec3 pos; 
            attribute vec2 texCoord; 
            attribute vec3 normal;

            uniform mat4 mvp; 

            varying vec2 v_texCoord; 
            varying vec3 v_normal; 
            varying vec3 v_fragPos; // Position of the fragment in world space

            void main()
            {
                v_texCoord = texCoord;
                v_normal = normal;
                v_fragPos = pos;

                gl_Position = mvp * vec4(pos,1);
            }`;


const meshFS = `
        precision mediump float;

        uniform bool showTex;
        uniform bool enableLighting;
        uniform sampler2D tex;
        uniform sampler2D tex2; // Second texture sampler
        uniform vec3 color;
        uniform vec3 lightPos;
        uniform float ambient;
        uniform float specularIntensity;
        uniform bool hasTexture2;    // Indicates if second texture is loaded
        uniform bool blendTextures;  // Indicates if textures should be blended

        varying vec2 v_texCoord;
        varying vec3 v_normal;
        varying vec3 v_fragPos;

        void main()
        {
            vec4 texColor = texture2D(tex, v_texCoord);

            if (hasTexture2) {
                vec4 texColor2 = texture2D(tex2, v_texCoord);
                if (blendTextures) {
                    // Blend the textures (50% each)
                    texColor = mix(texColor, texColor2, 0.5);
                } else {
                    // Use the second texture only
                    texColor = texColor2;
                }
            }

            if (enableLighting) {
                vec3 normal = normalize(v_normal);
                vec3 lightDir = normalize(lightPos - v_fragPos);
                vec3 viewDir = normalize(-v_fragPos);

                // Ambient component
                vec3 ambientComponent = ambient * texColor.rgb;

                // Diffuse component
                float diff = max(dot(normal, lightDir), 0.0);
                vec3 diffuseComponent = diff * texColor.rgb;

                // Specular component
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                vec3 specularColor = vec3(1.0, 1.0, 1.0);
                vec3 specularComponent = specularIntensity * spec * specularColor;

                // Combine all components
                vec3 lighting = ambientComponent + diffuseComponent + specularComponent;
                lighting = clamp(lighting, 0.0, 1.0);

                gl_FragColor = vec4(lighting, texColor.a);
            }
            else if (showTex) {
                gl_FragColor = texColor;
            }
            else {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
        }
        `;

// Ensure that 'keys' is a global variable shared between scripts
if (typeof keys === 'undefined') {
    var keys = {};
}

function SetSpecularLight(param) {
    const intensity = param.value / 100; // Normalize the slider value (0.01 to 1.0)
    meshDrawer.setSpecularLight(intensity); // Set the intensity in MeshDrawer
    DrawScene(); // Redraw the scene to apply changes
}

function LoadTexture2(param) {
    if (param.files && param.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                meshDrawer.setTexture2(img);
                DrawScene();
            }
        };
        reader.readAsDataURL(param.files[0]);
    }
}

var blendTextures = false;
var meshDrawer;

// Light direction parameters for Task 2
var lightX = 0;
var lightY = 0;

function updateLightPos() {
    const translationSpeed = 1;
    if (keys['ArrowUp']) lightY += translationSpeed; // Move light up
    if (keys['ArrowDown']) lightY -= translationSpeed; // Move light down
    if (keys['ArrowRight']) lightX += translationSpeed; // Move light right
    if (keys['ArrowLeft']) lightX -= translationSpeed; // Move light left
}

// Use addEventListener to avoid overwriting existing handlers
window.addEventListener('keydown', function(event) {
    keys[event.key] = true;

    if (event.key === 'b' || event.key === 'B') {
        blendTextures = !blendTextures;
        meshDrawer.setBlendTextures(blendTextures);
    }

    DrawScene();
});

window.addEventListener('keyup', function(event) {
    keys[event.key] = false;
});
